
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicRestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRestaurants(city?: string, search?: string) {
    const normalizedCity = city?.trim();
    const normalizedSearch = search?.trim();

    return this.prisma.restaurant.findMany({
      where: {
        isPublished: true,
        isActive: true,
        branch: {
          isActive: true,
        },
        ...(normalizedCity
          ? {
              city: {
                equals: normalizedCity,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(normalizedSearch
          ? {
              name: {
                contains: normalizedSearch,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        logoUrl: true,
        coverImageUrl: true,
        openingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });
  }

  async getRestaurantBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        slug,
        isPublished: true,
        isActive: true,
        branch: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        logoUrl: true,
        coverImageUrl: true,
        openingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found.');
    }

    return restaurant;
  }
}
