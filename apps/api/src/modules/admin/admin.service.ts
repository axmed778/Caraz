import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Users ───────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          profile: { select: { firstName: true, lastName: true } },
          _count: { select: { listings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u: any) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isVerified: u.isVerified,
        isActive: u.isActive,
        firstName: u.profile?.firstName || null,
        lastName: u.profile?.lastName || null,
        listingCount: u._count.listings,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async suspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Suspend all active listings
    await this.prisma.listing.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'SUSPENDED' },
    });

    return { ok: true };
  }

  async reactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return { ok: true };
  }

  // ─── Listings ────────────────────────────────────────────

  async getListings(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brand: { select: { name: true } },
          model: { select: { name: true } },
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map((l: any) => ({
        id: l.id,
        brandName: l.brand.name,
        modelName: l.model.name,
        year: l.year,
        price: Number(l.price),
        currency: l.currency,
        status: l.status,
        isFeatured: l.isFeatured,
        views: l.views,
        vin: l.vin,
        seller: { id: l.user.id, email: l.user.email, phone: l.user.phone },
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async suspendListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'SUSPENDED' },
    });

    return { ok: true };
  }

  async activateListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'ACTIVE' },
    });

    return { ok: true };
  }

  async featureListing(listingId: string, days: number) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { isFeatured: true, featuredUntil },
    });

    return { ok: true, featuredUntil: featuredUntil.toISOString() };
  }

  // ─── Dealers ─────────────────────────────────────────────

  async getDealers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.dealer.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { email: true, phone: true, isActive: true } },
          _count: { select: { listings: true } },
        },
      }),
      this.prisma.dealer.count(),
    ]);

    return {
      items: items.map((d: any) => ({
        id: d.id,
        name: d.name,
        isVerified: d.isVerified,
        email: d.user.email,
        phone: d.user.phone,
        isActive: d.user.isActive,
        listingCount: d._count.listings,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async verifyDealer(dealerId: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    await this.prisma.dealer.update({
      where: { id: dealerId },
      data: { isVerified: true },
    });

    return { ok: true };
  }

  // ─── Fraud / Anomalies ────────────────────────────────────

  async getAnomalies(page = 1, limit = 20, resolved?: boolean) {
    const skip = (page - 1) * limit;
    const where = resolved !== undefined ? { resolved } : {};

    const [items, total] = await Promise.all([
      this.prisma.vinOdometerAnomaly.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vinOdometerAnomaly.count({ where }),
    ]);

    return {
      items: items.map((a: any) => ({
        id: a.id,
        vin: a.vin,
        anomalyType: a.anomalyType,
        reportedValue: a.reportedValue,
        expectedMin: a.expectedMin,
        expectedMax: a.expectedMax,
        confidence: a.confidence,
        resolved: a.resolved,
        resolution: a.resolution,
        detectedAt: a.detectedAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async resolveAnomaly(anomalyId: string, resolution: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE') {
    const anomaly = await this.prisma.vinOdometerAnomaly.findUnique({
      where: { id: anomalyId },
    });
    if (!anomaly) throw new NotFoundException('Anomaly not found');

    await this.prisma.vinOdometerAnomaly.update({
      where: { id: anomalyId },
      data: { resolved: true, resolution },
    });

    // If confirmed fraud, update fraud score
    if (resolution === 'CONFIRMED_FRAUD') {
      await this.prisma.vinRegistry.update({
        where: { vin: anomaly.vin },
        data: { fraudScore: { increment: 30 } },
      });
    }

    return { ok: true };
  }

  // ─── Overview stats ───────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalListings,
      activeListings,
      totalDealers,
      verifiedDealers,
      pendingAnomalies,
      pendingBoosts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dealer.count(),
      this.prisma.dealer.count({ where: { isVerified: true } }),
      this.prisma.vinOdometerAnomaly.count({ where: { resolved: false } }),
      this.prisma.boostRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalListings,
      activeListings,
      totalDealers,
      verifiedDealers,
      pendingAnomalies,
      pendingBoosts,
    };
  }
}
