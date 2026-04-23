import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPublicOverview() {
    const [
      totalActiveListings,
      totalBrands,
      totalDealers,
      topBrands,
      recentListingsCount,
    ] = await Promise.all([
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.brand.count(),
      this.prisma.dealer.count({ where: { isVerified: true } }),
      this.prisma.listing.groupBy({
        by: ['brandId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.listing.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Resolve brand names
    const brandIds = topBrands.map((b: any) => b.brandId);
    const brands = await this.prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, name: true },
    });
    const brandMap = Object.fromEntries(brands.map((b: any) => [b.id, b.name]));

    return {
      totalActiveListings,
      totalBrands,
      verifiedDealers: totalDealers,
      newListingsLast7Days: recentListingsCount,
      topBrands: topBrands.map((b: any) => ({
        brandId: b.brandId,
        brandName: brandMap[b.brandId] || null,
        listingCount: b._count.id,
      })),
    };
  }

  async getPriceStats(brandId?: number, modelId?: number) {
    const where: any = {
      status: 'ACTIVE',
      ...(brandId && { brandId }),
      ...(modelId && { modelId }),
    };

    const result = await this.prisma.listing.aggregate({
      where,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { id: true },
    });

    return {
      count: result._count.id,
      avgPrice: result._avg.price ? Number(result._avg.price) : null,
      minPrice: result._min.price ? Number(result._min.price) : null,
      maxPrice: result._max.price ? Number(result._max.price) : null,
    };
  }

  async getListingStats(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        userId: true,
        views: true,
        createdAt: true,
        isFeatured: true,
        featuredUntil: true,
        _count: { select: { savedBy: true, conversations: true } },
      },
    });

    if (!listing || listing.userId !== userId) return null;

    return {
      views: listing.views,
      savedCount: listing._count.savedBy,
      conversationCount: listing._count.conversations,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil?.toISOString() || null,
      daysSinceListed: Math.floor(
        (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
    };
  }

  async getMarketTrends(brandId?: number, modelId?: number) {
    // Price trend over last 6 months — monthly averages
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const where: any = {
      status: 'ACTIVE',
      createdAt: { gte: sixMonthsAgo },
      ...(brandId && { brandId }),
      ...(modelId && { modelId }),
    };

    // Group by month using raw query for simplicity
    const listings = await this.prisma.listing.findMany({
      where,
      select: { price: true, createdAt: true },
    });

    // Build monthly buckets
    const buckets: Record<string, { total: number; count: number }> = {};
    for (const l of listings) {
      const key = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets[key]) buckets[key] = { total: 0, count: 0 };
      buckets[key].total += Number(l.price);
      buckets[key].count += 1;
    }

    const trend = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { total, count }]) => ({
        month,
        avgPrice: Math.round(total / count),
        listingCount: count,
      }));

    return { trend };
  }
}
