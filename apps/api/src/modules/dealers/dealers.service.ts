import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { name: string; description?: string; address?: string; cityId?: number; phone?: string; website?: string }) {
    const existing = await this.prisma.dealer.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('You already have a dealer profile');

    const dealer = await this.prisma.dealer.create({
      data: { userId, ...dto },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'DEALER' },
    });

    return dealer;
  }

  async findById(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        city: true,
        user: { select: { id: true, email: true } },
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');
    return dealer;
  }

  async update(id: string, userId: string, dto: Partial<{ name: string; description: string; address: string; cityId: number; phone: string; website: string }>) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');
    if (dealer.userId !== userId) throw new ForbiddenException('Not your dealer profile');

    return this.prisma.dealer.update({ where: { id }, data: dto });
  }

  async getDealerListings(dealerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { dealerId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brand: { select: { name: true } },
          model: { select: { name: true } },
          city: { select: { name: true } },
          images: { where: { isCover: true }, take: 1, select: { urlThumb: true } },
        },
      }),
      this.prisma.listing.count({ where: { dealerId, status: 'ACTIVE' } }),
    ]);
    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }
}
