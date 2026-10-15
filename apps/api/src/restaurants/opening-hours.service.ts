
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { OrganizationRole } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { UpsertOpeningHourDto } from './dto/upsert-opening-hour.dto.js';
  
  @Injectable()
  export class OpeningHoursService {
    constructor(private readonly prisma: PrismaService) {}
  
    private async assertCanManage(
      organizationId: string,
      userId: string,
    ) {
      const membership =
        await this.prisma.organizationMember.findFirst({
          where: {
            organizationId,
            userId,
            isActive: true,
            organization: { isActive: true },
          },
          select: { role: true },
        });
  
      const canManage =
        membership?.role === OrganizationRole.OWNER ||
        membership?.role === OrganizationRole.ADMIN;

      if (!canManage) {
        throw new ForbiddenException(
          'Only organization owners and admins can manage opening hours.',
        );
      }
    }
  
    private async assertRestaurantBelongsToOrganization(
      organizationId: string,
      restaurantId: string,
    ) {
      const restaurant =
        await this.prisma.restaurant.findFirst({
          where: {
            id: restaurantId,
            branch: { organizationId },
          },
          select: { id: true },
        });
  
      if (!restaurant) {
        throw new NotFoundException(
          'Restaurant not found in this organization.',
        );
      }
    }
  
    async list(
      organizationId: string,
      restaurantId: string,
    ) {
      await this.assertRestaurantBelongsToOrganization(
        organizationId,
        restaurantId,
      );
  
      return this.prisma.openingHour.findMany({
        where: { restaurantId },
        orderBy: { dayOfWeek: 'asc' },
      });
    }
  
    async upsert(
      organizationId: string,
      userId: string,
      restaurantId: string,
      dto: UpsertOpeningHourDto,
    ) {
      await this.assertCanManage(organizationId, userId);
  
      await this.assertRestaurantBelongsToOrganization(
        organizationId,
        restaurantId,
      );
  
      const isClosed = dto.isClosed ?? false;
  
      let openTime = dto.openTime;
      let closeTime = dto.closeTime;
  
      if (isClosed) {
        openTime = '00:00';
        closeTime = '00:00';
      } else {
        if (!openTime || !closeTime) {
          throw new BadRequestException(
            'openTime and closeTime are required for an open day.',
          );
        }
  
        // This version supports same-day hours, not overnight hours.
        if (openTime >= closeTime) {
          throw new BadRequestException(
            'closeTime must be later than openTime. Overnight hours are not supported yet.',
          );
        }
      }
  
      return this.prisma.openingHour.upsert({
        where: {
          restaurantId_dayOfWeek: {
            restaurantId,
            dayOfWeek: dto.dayOfWeek,
          },
        },
        create: {
          restaurantId,
          dayOfWeek: dto.dayOfWeek,
          openTime,
          closeTime,
          isClosed,
        },
        update: {
          openTime,
          closeTime,
          isClosed,
        },
      });
    }
  }
  