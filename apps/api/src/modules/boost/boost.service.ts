import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BoostDuration } from '@caraz/database';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestBoostDto } from './boost.dto';

const BOOST_PRICES: Record<BoostDuration, number> = {
  DAYS_7: 5,
  DAYS_14: 9,
  DAYS_30: 18,
};

const BOOST_DAYS: Record<BoostDuration, number> = {
  DAYS_7: 7,
  DAYS_14: 14,
  DAYS_30: 30,
};

@Injectable()
export class BoostService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async requestBoost(userId: string, dto: RequestBoostDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('Not your listing');
    }

    // No pending/active boost requests for this listing
    const pending = await this.prisma.boostRequest.findFirst({
      where: { listingId: dto.listingId, status: 'PENDING' },
    });

    if (pending) {
      throw new BadRequestException('You already have a pending boost request for this listing');
    }

    const request = await this.prisma.boostRequest.create({
      data: {
        listingId: dto.listingId,
        userId,
        duration: dto.duration,
        amountAzn: BOOST_PRICES[dto.duration],
        paymentNote: dto.paymentNote,
        status: 'PENDING',
      },
    });

    return {
      id: request.id,
      amountAzn: BOOST_PRICES[dto.duration],
      duration: dto.duration,
      durationDays: BOOST_DAYS[dto.duration],
      status: 'PENDING',
      message: `Please transfer ${BOOST_PRICES[dto.duration]} AZN and include your boost request ID in the payment note.`,
    };
  }

  async getMyRequests(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.boostRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.boostRequest.count({ where: { userId } }),
    ]);

    return {
      items: items.map(this.formatRequest),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  // ─── Admin-only methods ───────────────────────────────────

  async adminGetPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.boostRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
              user: {
                select: {
                  id: true,
                  phone: true,
                  profile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.boostRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      items: items.map(this.formatRequest),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async adminApprove(requestId: string, adminId: string) {
    const request = await this.prisma.boostRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Boost request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    const days = BOOST_DAYS[request.duration];
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    await Promise.all([
      this.prisma.boostRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
      }),
      this.prisma.listing.update({
        where: { id: request.listingId },
        data: { isFeatured: true, featuredUntil },
      }),
    ]);

    this.notifications.push(request.userId, 'BOOST_APPROVED', {
      listingId: request.listingId,
      featuredUntil: featuredUntil.toISOString(),
      durationDays: days,
    }).catch(() => {});

    return { ok: true, featuredUntil: featuredUntil.toISOString() };
  }

  async adminReject(requestId: string, adminId: string) {
    const request = await this.prisma.boostRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Boost request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    await this.prisma.boostRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date() },
    });

    this.notifications.push(request.userId, 'BOOST_REJECTED', {
      listingId: request.listingId,
    }).catch(() => {});

    return { ok: true };
  }

  // Expire featured listings whose featuredUntil has passed (call via cron)
  async expireStaleBoosts() {
    const { count } = await this.prisma.listing.updateMany({
      where: {
        isFeatured: true,
        featuredUntil: { lt: new Date() },
      },
      data: { isFeatured: false },
    });
    return { expired: count };
  }

  private formatRequest(r: any) {
    return {
      id: r.id,
      listingId: r.listingId,
      duration: r.duration,
      amountAzn: Number(r.amountAzn),
      status: r.status,
      paymentNote: r.paymentNote,
      reviewedAt: r.reviewedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      listing: r.listing
        ? {
            brandName: r.listing.brand?.name,
            modelName: r.listing.model?.name,
            year: r.listing.year,
            price: Number(r.listing.price),
          }
        : undefined,
    };
  }
}
