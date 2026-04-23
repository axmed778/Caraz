import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StartConversationDto, SendMessageDto } from './messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async startConversation(buyerId: string, dto: StartConversationDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { user: { select: { id: true } } },
    });

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId === buyerId) {
      throw new BadRequestException('Cannot message yourself');
    }

    const sellerId = listing.userId;

    // Upsert conversation (buyer+listing is unique)
    let conversation = await this.prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId: dto.listingId, buyerId } },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { listingId: dto.listingId, buyerId, sellerId },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buyerId,
        body: dto.firstMessage,
        type: 'TEXT',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    // Notify seller
    this.notifications.push(sellerId, 'NEW_MESSAGE', {
      conversationId: conversation.id,
      listingId: dto.listingId,
      senderName: null,
    }).catch(() => {});

    return { conversationId: conversation.id, messageId: message.id };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isMember = conversation.buyerId === userId || conversation.sellerId === userId;
    if (!isMember) throw new ForbiddenException('Not a participant');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: dto.body,
        type: dto.type || 'TEXT',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // Notify the other party
    const recipientId = conversation.buyerId === userId
      ? conversation.sellerId
      : conversation.buyerId;

    this.notifications.push(recipientId, 'NEW_MESSAGE', {
      conversationId,
      listingId: conversation.listingId,
    }).catch(() => {});

    return this.formatMessage(message);
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
              images: {
                where: { isCover: true },
                take: 1,
                select: { urlThumb: true },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          seller: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.conversation.count({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      }),
    ]);

    return {
      items: items.map((c: any) => {
        const lastMsg = c.messages[0];
        const unreadCount = 0; // Will be populated below if needed
        const otherParty = c.buyerId === userId ? c.seller : c.buyer;
        return {
          id: c.id,
          listingId: c.listingId,
          listing: {
            brandName: c.listing.brand.name,
            modelName: c.listing.model.name,
            year: c.listing.year,
            price: Number(c.listing.price),
            currency: c.listing.currency,
            coverImageUrl: c.listing.images[0]?.urlThumb || null,
          },
          otherParty: {
            id: otherParty.id,
            firstName: otherParty.profile?.firstName || null,
            lastName: otherParty.profile?.lastName || null,
            avatarUrl: otherParty.profile?.avatarUrl || null,
          },
          lastMessage: lastMsg
            ? { body: lastMsg.body, createdAt: lastMsg.createdAt.toISOString(), senderId: lastMsg.senderId }
            : null,
          lastMessageAt: c.lastMessageAt?.toISOString() || null,
          createdAt: c.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 40) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isMember = conversation.buyerId === userId || conversation.sellerId === userId;
    if (!isMember) throw new ForbiddenException('Not a participant');

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark unread messages from the other party as read
    this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    }).catch(() => {});

    return {
      items: items.map(this.formatMessage).reverse(), // oldest first
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async getUnreadCount(userId: string) {
    // Count conversations with at least one unread message from other party
    const result = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
      _count: true,
    });

    return { count: result.length };
  }

  private formatMessage(msg: any) {
    return {
      id: msg.id,
      body: msg.body,
      type: msg.type,
      senderId: msg.senderId,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    };
  }
}
