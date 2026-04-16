import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@caraz/database';

export interface SearchFilters {
  brandId?: number;
  modelId?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  cityId?: number;
  query?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(filters: SearchFilters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      ...(filters.brandId    && { brandId: filters.brandId }),
      ...(filters.modelId    && { modelId: filters.modelId }),
      ...(filters.cityId     && { cityId: filters.cityId }),
      ...(filters.fuelType   && { fuelType: filters.fuelType as any }),
      ...(filters.transmission && { transmission: filters.transmission as any }),
      ...(filters.bodyType   && { bodyType: filters.bodyType as any }),
      ...((filters.yearMin || filters.yearMax) && {
        year: {
          ...(filters.yearMin && { gte: filters.yearMin }),
          ...(filters.yearMax && { lte: filters.yearMax }),
        },
      }),
      ...((filters.priceMin || filters.priceMax) && {
        price: {
          ...(filters.priceMin && { gte: filters.priceMin }),
          ...(filters.priceMax && { lte: filters.priceMax }),
        },
      }),
      ...(filters.mileageMax && { mileage: { lte: filters.mileageMax } }),
      ...(filters.query && {
        OR: [
          { description: { contains: filters.query, mode: 'insensitive' } },
          { vin: { contains: filters.query, mode: 'insensitive' } },
          { brand: { name: { contains: filters.query, mode: 'insensitive' } } },
          { model: { name: { contains: filters.query, mode: 'insensitive' } } },
        ],
      }),
    };

    const orderBy = this.resolveOrderBy(filters.sortBy);

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          price: true,
          currency: true,
          year: true,
          mileage: true,
          fuelType: true,
          transmission: true,
          isFeatured: true,
          createdAt: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
          city: { select: { name: true } },
          images: {
            where: { isCover: true },
            take: 1,
            select: { urlThumb: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(l => ({
        id: l.id,
        price: Number(l.price),
        currency: l.currency,
        year: l.year,
        mileage: l.mileage,
        fuelType: l.fuelType,
        transmission: l.transmission,
        isFeatured: l.isFeatured,
        brandName: l.brand.name,
        modelName: l.model.name,
        cityName: l.city.name,
        coverImageUrl: l.images[0]?.urlThumb || null,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async getFilterCounts(filters: Omit<SearchFilters, 'brandId' | 'modelId'>) {
    // Returns how many results exist per brand — useful for filter UI
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      ...(filters.cityId && { cityId: filters.cityId }),
      ...(filters.fuelType && { fuelType: filters.fuelType as any }),
    };

    const brandCounts = await this.prisma.listing.groupBy({
      by: ['brandId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return { brands: brandCounts.map(b => ({ brandId: b.brandId, count: b._count.id })) };
  }

  private resolveOrderBy(sortBy?: string): Prisma.ListingOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price_asc':    return [{ price: 'asc' }];
      case 'price_desc':   return [{ price: 'desc' }];
      case 'date_asc':     return [{ createdAt: 'asc' }];
      case 'mileage_asc':  return [{ mileage: 'asc' }];
      case 'year_desc':    return [{ year: 'desc' }];
      default:             return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }
}
