import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'LISTING_SOLD'
  | 'PRICE_DROP'
  | 'BOOST_APPROVED'
  | 'BOOST_REJECTED'
  | 'LISTING_SUSPENDED'
  | 'SAVED_SEARCH_MATCH';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Called by other services to push a notification
  async push(userId: string, type: NotificationType, payload: Record<string, any> = {}) {
    return this.prisma.notification.create({
      data: { userId, type, payload },
    });
  }

  async findAll(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map((n: any) => ({
        id: n.id,
        type: n.type,
        payload: n.payload,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
