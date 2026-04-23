import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async save(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Listing not found');
    }

    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) throw new ConflictException('Already saved');

    await this.prisma.savedListing.create({ data: { userId, listingId } });
    return { saved: true };
  }

  async unsave(userId: string, listingId: string) {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!existing) throw new NotFoundException('Not saved');

    await this.prisma.savedListing.delete({
      where: { userId_listingId: { userId, listingId } },
    });
    return { saved: false };
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.savedListing.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
              city: { select: { name: true } },
              images: {
                where: { isCover: true },
                take: 1,
                select: { urlThumb: true, urlMedium: true },
              },
            },
          },
        },
      }),
      this.prisma.savedListing.count({ where: { userId } }),
    ]);

    return {
      items: items
        .filter((s: any) => s.listing.status !== 'DELETED')
        .map((s: any) => ({
          savedAt: s.createdAt.toISOString(),
          listing: {
            id: s.listing.id,
            price: Number(s.listing.price),
            currency: s.listing.currency,
            year: s.listing.year,
            mileage: s.listing.mileage,
            fuelType: s.listing.fuelType,
            transmission: s.listing.transmission,
            brandName: s.listing.brand.name,
            modelName: s.listing.model.name,
            cityName: s.listing.city.name,
            coverImageUrl: s.listing.images[0]?.urlThumb || s.listing.images[0]?.urlMedium || null,
            isFeatured: s.listing.isFeatured,
            status: s.listing.status,
            createdAt: s.listing.createdAt.toISOString(),
          },
        })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async isSaved(userId: string, listingId: string): Promise<boolean> {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    return !!existing;
  }
}
