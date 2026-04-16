import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferenceService {
  constructor(private prisma: PrismaService) {}

  async getBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { models: true } } },
    });
  }

  async getModels(brandId?: number) {
    return this.prisma.model.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  async getColors() {
    return this.prisma.color.findMany({ orderBy: { name: 'asc' } });
  }

  // Returns everything needed to build all filter dropdowns in one request
  async getAll() {
    const [brands, cities, colors] = await Promise.all([
      this.getBrands(),
      this.getCities(),
      this.getColors(),
    ]);
    return { brands, cities, colors };
  }
}
