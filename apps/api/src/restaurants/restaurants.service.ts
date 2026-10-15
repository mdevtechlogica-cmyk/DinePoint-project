import {
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import {
    OrganizationRole,
    Prisma,
  } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
  import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
  
  @Injectable()
  export class RestaurantsService {
    constructor(private readonly prisma: PrismaService) {}
  
    private async assertCanManage(
      organizationId: string,
      userId: string,
    ): Promise<void> {
      const membership =
        await this.prisma.organizationMember.findFirst({
          where: {
            organizationId,
            userId,
            isActive: true,
            organization: {
              isActive: true,
            },
          },
          select: {
            role: true,
          },
        });
  
      const canManage =
        membership?.role === OrganizationRole.OWNER ||
        membership?.role === OrganizationRole.ADMIN;

      if (!canManage) {
        throw new ForbiddenException(
          'Only organization owners and admins can manage restaurants.',
        );
      }
    }
  
    private slugify(value: string): string {
      return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    }
  
    async create(
      organizationId: string,
      userId: string,
      dto: CreateRestaurantDto,
    ) {
      await this.assertCanManage(organizationId, userId);
  
      const baseSlug =
        this.slugify(dto.restaurantName) || 'restaurant';
  
      // Add a random suffix to reduce slug collisions.
      const slug =
        `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  
      return this.prisma.$transaction(async (tx) => {
        const branch = await tx.branch.create({
          data: {
            organizationId,
            name: dto.branchName,
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
            phone: dto.phone,
            country: 'India',
            timezone: 'Asia/Kolkata',
          },
        });
  
        const restaurant = await tx.restaurant.create({
          data: {
            branchId: branch.id,
            name: dto.restaurantName,
            slug,
            description: dto.description,
            email: dto.email,
            phone: dto.phone,
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            area: dto.area,
            city: dto.city,
            state: dto.state,
            country: 'India',
            postalCode: dto.postalCode,
            isPublished: false,
            isActive: true,
          },
          include: {
            branch: true,
          },
        });
  
        return restaurant;
      });
    }
  
    async findAll(organizationId: string) {
      return this.prisma.restaurant.findMany({
        where: {
          branch: {
            organizationId,
          },
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  
    async findOne(
      organizationId: string,
      restaurantId: string,
    ) {
      const restaurant =
        await this.prisma.restaurant.findFirst({
          where: {
            id: restaurantId,
            branch: {
              organizationId,
            },
          },
          include: {
            branch: true,
            openingHours: true,
            tables: true,
          },
        });
  
      if (!restaurant) {
        throw new NotFoundException(
          'Restaurant not found in this organization.',
        );
      }
  
      return restaurant;
    }
  
    async update(
      organizationId: string,
      userId: string,
      restaurantId: string,
      dto: UpdateRestaurantDto,
    ) {
      await this.assertCanManage(organizationId, userId);
  
      const existing = await this.findOne(
        organizationId,
        restaurantId,
      );
  
      return this.prisma.$transaction(async (tx) => {
        // Keep branch details synchronized with restaurant address
        // when the corresponding fields are provided.
        if (
          dto.branchName !== undefined ||
          dto.addressLine1 !== undefined ||
          dto.addressLine2 !== undefined ||
          dto.city !== undefined ||
          dto.state !== undefined ||
          dto.postalCode !== undefined ||
          dto.phone !== undefined
        ) {
          await tx.branch.update({
            where: {
              id: existing.branchId,
            },
            data: {
              name: dto.branchName,
              addressLine1: dto.addressLine1,
              addressLine2: dto.addressLine2,
              city: dto.city,
              state: dto.state,
              postalCode: dto.postalCode,
              phone: dto.phone,
            },
          });
        }
  
        return tx.restaurant.update({
          where: {
            id: restaurantId,
          },
          data: {
            name: dto.restaurantName,
            description: dto.description,
            email: dto.email,
            phone: dto.phone,
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            area: dto.area,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
          },
          include: {
            branch: true,
          },
        });
      });
    }
  
    async setPublished(
      organizationId: string,
      userId: string,
      restaurantId: string,
      isPublished: boolean,
    ) {
      await this.assertCanManage(organizationId, userId);
  
      const restaurant = await this.prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
          branch: {
            organizationId,
          },
        },
        select: {
          id: true,
        },
      });
  
      if (!restaurant) {
        throw new NotFoundException(
          'Restaurant not found in this organization.',
        );
      }
  
      return this.prisma.restaurant.update({
        where: {
          id: restaurantId,
        },
        data: {
          isPublished,
        },
      });
    }
  }