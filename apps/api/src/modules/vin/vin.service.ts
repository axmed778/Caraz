import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { DelistReason, MileageSource } from '@caraz/database';

@Injectable()
export class VinService {
  constructor(private prisma: PrismaService) {}

  async validateVinForNewListing(
    vin: string,
    userId: string,
    price: number,
    mileage: number,
  ) {
    const normalizedVin = vin.toUpperCase();
    const registry = await this.prisma.vinRegistry.findUnique({
      where: { vin: normalizedVin },
      include: {
        listingHistory: { orderBy: { listedAt: 'desc' }, take: 5 },
        mileageHistory: { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    });

    if (!registry) return; // First time — no history to check

    // Check: is this VIN currently active on another user's listing?
    const activeListing = await this.prisma.listing.findFirst({
      where: { vin: normalizedVin, status: 'ACTIVE', userId: { not: userId } },
    });
    if (activeListing) {
      throw new BadRequestException(
        'This VIN is already listed by another seller. Contact support if you purchased this car.',
      );
    }

    // Check: mileage cannot be below highest recorded
    const highestMileage = registry.mileageHistory.length > 0
      ? Math.max(...registry.mileageHistory.map((m: any) => m.recordedMileage))
      : 0;

    if (mileage < highestMileage) {
      throw new BadRequestException(
        `Mileage cannot be lower than previously recorded value of ${highestMileage.toLocaleString()} km`,
      );
    }

    // Check: minimum relist gap for same user (3 days)
    const userLastListing = registry.listingHistory.find((l: any) => l.userId === userId);
    if (userLastListing?.delistedAt) {
      const daysSince = Math.floor(
        (Date.now() - userLastListing.delistedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < 3) {
        throw new BadRequestException('You can relist this car after 3 days');
      }
    }
  }

  async registerListing(
    vin: string,
    listingId: string,
    userId: string,
    price: number,
    mileage: number,
  ) {
    // Upsert VIN registry
    await this.prisma.vinRegistry.upsert({
      where: { vin },
      create: {
        vin,
        totalListings: 1,
        totalOwners: 1,
        lastListedAt: new Date(),
      },
      update: {
        totalListings: { increment: 1 },
        lastListedAt: new Date(),
      },
    });

    // Count distinct owners
    const distinctOwners = await this.prisma.vinListingHistory.findMany({
      where: { vin },
      select: { userId: true },
      distinct: ['userId'],
    });
    const ownerSet = new Set(distinctOwners.map((o: any) => o.userId));
    ownerSet.add(userId);

    await this.prisma.vinRegistry.update({
      where: { vin },
      data: { totalOwners: ownerSet.size },
    });

    // Record listing history
    await this.prisma.vinListingHistory.create({
      data: {
        vin,
        listingId,
        userId,
        listedPrice: price,
        listedMileage: mileage,
      },
    });

    // Record mileage
    await this.recordMileage(vin, mileage, 'LISTING_SUBMISSION', userId);

    // Compute fraud score
    await this.computeFraudScore(vin);
  }

  async recordPriceChange(
    vin: string,
    listingId: string,
    oldPrice: number,
    newPrice: number,
  ) {
    const changePct = ((newPrice - oldPrice) / oldPrice) * 100;

    await this.prisma.vinPriceHistory.create({
      data: {
        vin,
        listingId,
        oldPrice,
        newPrice,
        changePct,
      },
    });
  }

  async recordMileage(
    vin: string,
    mileage: number,
    source: MileageSource,
    userId?: string,
  ) {
    // Check for rollback
    const lastRecord = await this.prisma.vinMileageHistory.findFirst({
      where: { vin },
      orderBy: { recordedAt: 'desc' },
    });

    if (lastRecord && mileage < lastRecord.recordedMileage) {
      // Record anomaly
      await this.prisma.vinOdometerAnomaly.create({
        data: {
          vin,
          anomalyType: 'ROLLBACK_DETECTED',
          expectedMin: lastRecord.recordedMileage,
          reportedValue: mileage,
          confidence: 90,
        },
      });
    }

    await this.prisma.vinMileageHistory.create({
      data: {
        vin,
        recordedMileage: mileage,
        source,
        recordedByUserId: userId,
      },
    });
  }

  async recordDelist(
    vin: string,
    listingId: string,
    reason: DelistReason,
    finalPrice: number,
  ) {
    const history = await this.prisma.vinListingHistory.findFirst({
      where: { vin, listingId, delistedAt: null },
    });

    if (history) {
      const daysListed = Math.floor(
        (Date.now() - history.listedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.prisma.vinListingHistory.update({
        where: { id: history.id },
        data: {
          delistedAt: new Date(),
          delistReason: reason,
          daysListed,
          finalPrice,
        },
      });
    }
  }

  async getVinHistory(vin: string) {
    const registry = await this.prisma.vinRegistry.findUnique({
      where: { vin },
      include: {
        listingHistory: { orderBy: { listedAt: 'asc' } },
        priceHistory: { orderBy: { changedAt: 'asc' } },
        mileageHistory: { orderBy: { recordedAt: 'asc' } },
        anomalies: true,
      },
    });

    if (!registry) return null;

    const allPrices = [
      ...registry.listingHistory.map((l: any) => Number(l.listedPrice)),
      ...registry.listingHistory.filter((l: any) => l.finalPrice).map((l: any) => Number(l.finalPrice!)),
    ];

    const allMileages = registry.mileageHistory.map((m: any) => m.recordedMileage);

    return {
      vin: registry.vin,
      totalListings: registry.totalListings,
      totalDaysOnMarket: registry.listingHistory.reduce((sum: number, l: any) => sum + (l.daysListed || 0), 0),
      lowestPrice: allPrices.length > 0 ? Math.min(...allPrices) : null,
      highestRecordedMileage: allMileages.length > 0 ? Math.max(...allMileages) : null,
      hasRollbackAnomaly: registry.anomalies.some((a: any) => a.anomalyType === 'ROLLBACK_DETECTED'),
      listings: registry.listingHistory.map((l: any) => ({
        listedPrice: Number(l.listedPrice),
        finalPrice: l.finalPrice ? Number(l.finalPrice) : null,
        listedMileage: l.listedMileage,
        listedAt: l.listedAt.toISOString(),
        delistedAt: l.delistedAt?.toISOString() || null,
        daysListed: l.daysListed,
        isCurrentListing: !l.delistedAt,
      })),
      mileageTimeline: registry.mileageHistory.map((m: any) => ({
        recordedMileage: m.recordedMileage,
        recordedAt: m.recordedAt.toISOString(),
        source: m.source,
      })),
    };
  }

  private async computeFraudScore(vin: string) {
    const registry = await this.prisma.vinRegistry.findUnique({
      where: { vin },
      include: {
        listingHistory: true,
        mileageHistory: true,
        anomalies: true,
      },
    });

    if (!registry) return;

    let score = 0;

    // Multiple distinct owners
    const distinctOwners = new Set(registry.listingHistory.map((l: any) => l.userId)).size;
    if (distinctOwners >= 2) score += 20;
    if (distinctOwners >= 3) score += 20;

    // Odometer anomalies
    const rollbacks = registry.anomalies.filter((a: any) => a.anomalyType === 'ROLLBACK_DETECTED');
    score += rollbacks.length * 30;

    // Many price drops
    const priceDrops = registry.listingHistory.filter(
      (l: any) => l.finalPrice && Number(l.finalPrice) < Number(l.listedPrice),
    );
    if (priceDrops.length >= 2) score += 15;

    await this.prisma.vinRegistry.update({
      where: { vin },
      data: { fraudScore: Math.min(score, 100) },
    });
  }
}
