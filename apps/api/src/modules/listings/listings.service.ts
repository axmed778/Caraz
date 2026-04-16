import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@caraz/database';
import { PrismaService } from '../../prisma/prisma.service';
import { VinService } from '../vin/vin.service';
import { CreateListingBodyDto, UpdateListingBodyDto, ListingQueryDto } from './listings.dto';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private vinService: VinService,
  ) {}

  async create(userId: string, dto: CreateListingBodyDto) {
    // Validate VIN if provided
    if (dto.vin) {
      await this.vinService.validateVinForNewListing(dto.vin, userId, dto.price, dto.mileage);
    }

    const listing = await this.prisma.listing.create({
      data: {
        userId,
        brandId: dto.brandId,
        modelId: dto.modelId,
        year: dto.year,
        price: dto.price,
        currency: dto.currency || 'AZN',
        mileage: dto.mileage,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        driveType: dto.driveType,
        bodyType: dto.bodyType,
        colorId: dto.colorId,
        engineVolume: dto.engineVolume,
        horsepower: dto.horsepower,
        cityId: dto.cityId,
        description: dto.description,
        vin: dto.vin?.toUpperCase(),
      },
      include: this.listingIncludes(),
    });

    // Register VIN + mileage in history
    if (dto.vin) {
      await this.vinService.registerListing(dto.vin.toUpperCase(), listing.id, userId, dto.price, dto.mileage);
    }

    return this.formatListing(listing);
  }

  async findAll(query: ListingQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      ...(query.brandId && { brandId: query.brandId }),
      ...(query.modelId && { modelId: query.modelId }),
      ...(query.fuelType && { fuelType: query.fuelType }),
      ...(query.transmission && { transmission: query.transmission }),
      ...(query.bodyType && { bodyType: query.bodyType }),
      ...(query.cityId && { cityId: query.cityId }),
      ...((query.yearMin || query.yearMax) && {
        year: {
          ...(query.yearMin && { gte: query.yearMin }),
          ...(query.yearMax && { lte: query.yearMax }),
        },
      }),
      ...((query.priceMin || query.priceMax) && {
        price: {
          ...(query.priceMin && { gte: query.priceMin }),
          ...(query.priceMax && { lte: query.priceMax }),
        },
      }),
      ...(query.mileageMax && { mileage: { lte: query.mileageMax } }),
    };

    const orderBy = this.getOrderBy(query.sortBy);

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: this.listingCardIncludes(),
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(this.formatListingCard),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: this.listingIncludes(),
    });

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count (fire and forget)
    this.prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {}); // Non-critical, don't block response

    const result = this.formatListing(listing);

    // Attach VIN history if available
    if (listing.vin) {
      result.vinHistory = await this.vinService.getVinHistory(listing.vin);
    }

    return result;
  }

  async update(id: string, userId: string, dto: UpdateListingBodyDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    // Mileage can only go up
    if (dto.mileage !== undefined && dto.mileage < listing.mileage) {
      throw new BadRequestException('Mileage cannot be decreased');
    }

    // Track price change
    if (dto.price !== undefined && listing.vin && dto.price !== Number(listing.price)) {
      await this.vinService.recordPriceChange(
        listing.vin,
        listing.id,
        Number(listing.price),
        dto.price,
      );
    }

    // Track mileage change
    if (dto.mileage !== undefined && listing.vin && dto.mileage !== listing.mileage) {
      await this.vinService.recordMileage(listing.vin, dto.mileage, 'LISTING_UPDATE', userId);
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.mileage !== undefined && { mileage: dto.mileage }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.cityId !== undefined && { cityId: dto.cityId }),
        ...(dto.colorId !== undefined && { colorId: dto.colorId }),
      },
      include: this.listingIncludes(),
    });

    return this.formatListing(updated);
  }

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    // Record delist in VIN history
    if (listing.vin) {
      await this.vinService.recordDelist(listing.vin, listing.id, 'DELETED', Number(listing.price));
    }

    return { message: 'Listing deleted' };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { userId, status: { not: 'DELETED' } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: this.listingCardIncludes(),
      }),
      this.prisma.listing.count({ where: { userId, status: { not: 'DELETED' } } }),
    ]);

    return {
      items: items.map(this.formatListingCard),
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  // ─── Private helpers ───────────────────────────────────

  private listingIncludes() {
    return {
      brand: true,
      model: true,
      city: true,
      color: true,
      images: { orderBy: { sortOrder: 'asc' as const } },
      user: {
        select: {
          id: true,
          phone: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          dealer: { select: { id: true, name: true, logoUrl: true, isVerified: true } },
        },
      },
    };
  }

  private listingCardIncludes() {
    return {
      brand: { select: { name: true } },
      model: { select: { name: true } },
      city: { select: { name: true } },
      images: {
        where: { isCover: true },
        take: 1,
        select: { urlThumb: true, urlMedium: true },
      },
    };
  }

  private formatListingCard(listing: any) {
    return {
      id: listing.id,
      price: Number(listing.price),
      currency: listing.currency,
      year: listing.year,
      mileage: listing.mileage,
      fuelType: listing.fuelType,
      transmission: listing.transmission,
      brandName: listing.brand.name,
      modelName: listing.model.name,
      cityName: listing.city.name,
      coverImageUrl: listing.images[0]?.urlThumb || listing.images[0]?.urlMedium || null,
      isFeatured: listing.isFeatured,
      createdAt: listing.createdAt.toISOString(),
    };
  }

  private formatListing(listing: any) {
    return {
      id: listing.id,
      price: Number(listing.price),
      currency: listing.currency,
      year: listing.year,
      mileage: listing.mileage,
      fuelType: listing.fuelType,
      transmission: listing.transmission,
      driveType: listing.driveType,
      bodyType: listing.bodyType,
      engineVolume: listing.engineVolume ? Number(listing.engineVolume) : null,
      horsepower: listing.horsepower,
      description: listing.description,
      vin: listing.vin,
      views: listing.views,
      isFeatured: listing.isFeatured,
      brandName: listing.brand.name,
      modelName: listing.model.name,
      cityName: listing.city.name,
      colorName: listing.color?.name || null,
      colorHex: listing.color?.hexCode || null,
      images: listing.images.map((img: any) => ({
        id: img.id,
        urlOriginal: img.urlOriginal,
        urlThumb: img.urlThumb,
        urlMedium: img.urlMedium,
        urlLarge: img.urlLarge,
        sortOrder: img.sortOrder,
        isCover: img.isCover,
      })),
      seller: {
        id: listing.user.id,
        firstName: listing.user.profile?.firstName || null,
        lastName: listing.user.profile?.lastName || null,
        phone: listing.user.phone,
        avatarUrl: listing.user.profile?.avatarUrl || null,
        dealer: listing.user.dealer || null,
      },
      createdAt: listing.createdAt.toISOString(),
      vinHistory: null as any, // Populated separately in findOne
    };
  }

  private getOrderBy(sortBy?: string): Prisma.ListingOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price_asc':  return [{ price: 'asc' }];
      case 'price_desc': return [{ price: 'desc' }];
      case 'date_asc':   return [{ createdAt: 'asc' }];
      case 'mileage_asc': return [{ mileage: 'asc' }];
      case 'year_desc':  return [{ year: 'desc' }];
      default:           return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }
}
