import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: true,
        dealer: {
          select: { id: true, name: true, isVerified: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; bio?: string; cityId?: number }) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true, avatarUrl: true, cityId: true },
        },
        dealer: {
          select: { id: true, name: true, logoUrl: true, isVerified: true },
        },
        _count: {
          select: { listings: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
