
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyAuthGuard, RequireApiKeyScopes } from '../api-keys/guards/api-key-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IntegrationPaginationDto } from './dto/integration-pagination.dto.js';

type IntegrationRequest = Request & {
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  };
};

type PageRecord = {
  id: string;
};

@Controller('integrations')
@UseGuards(ApiKeyAuthGuard)
export class IntegrationsController {
  constructor(private readonly prisma: PrismaService) { }

  private getOrganizationId(request: IntegrationRequest): string {
    if (!request.apiKey?.organizationId) {
      throw new NotFoundException('Integration organization not found');
    }

    return request.apiKey.organizationId;
  }

  private async assertRestaurantAccess(
    organizationId: string,
    restaurantId: string,
  ): Promise<void> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        isActive: true,
        branch: {
          organizationId,
          isActive: true,
          organization: { isActive: true },
        },
      },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private paginationArgs(query: IntegrationPaginationDto) {
    const limit = query.limit ?? 50;

    return {
      take: limit + 1,
      ...(query.cursor
        ? {
          cursor: { id: query.cursor },
          skip: 1,
        }
        : {}),
    };
  }

  private async validateRestaurantCursor(
    organizationId: string,
    cursor?: string,
  ): Promise<void> {
    if (!cursor) return;

    const record = await this.prisma.restaurant.findFirst({
      where: {
        id: cursor,
        isActive: true,
        branch: {
          organizationId,
          isActive: true,
          organization: { isActive: true },
        },
      },
      select: { id: true },
    });

    if (!record) {
      throw new BadRequestException(
        'Invalid or inaccessible pagination cursor',
      );
    }
  }

  private buildPage<T extends PageRecord>(rows: T[], limit: number) {
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return {
      data,
      nextCursor: hasMore && data.length > 0
        ? data[data.length - 1].id
        : null,
    };
  }

  private async validateTableCursor(
    organizationId: string,
    restaurantId: string,
    cursor?: string,
  ): Promise<void> {
    if (!cursor) return;

    const record = await this.prisma.restaurantTable.findFirst({
      where: {
        id: cursor,
        restaurantId,
        isActive: true,
        restaurant: {
          branch: {
            organizationId,
            isActive: true,
            organization: { isActive: true },
          },
        },
      },
      select: { id: true },
    });

    if (!record) {
      throw new BadRequestException(
        'Invalid or inaccessible pagination cursor',
      );
    }
  }

  private async validateReservationCursor(
    organizationId: string,
    restaurantId: string,
    cursor?: string,
  ): Promise<void> {
    if (!cursor) return;

    const record = await this.prisma.reservation.findFirst({
      where: {
        id: cursor,
        restaurantId,
        restaurant: {
          branch: {
            organizationId,
            isActive: true,
            organization: { isActive: true },
          },
        },
      },
      select: { id: true },
    });

    if (!record) {
      throw new BadRequestException(
        'Invalid or inaccessible pagination cursor',
      );
    }
  }

  @Get('restaurants')
  @RequireApiKeyScopes('restaurants:read')
  async listRestaurants(
    @Req() request: IntegrationRequest,
    @Query() query: IntegrationPaginationDto,
  ) {
    const organizationId = this.getOrganizationId(request);

    await this.validateRestaurantCursor(
      organizationId,
      query.cursor,
    );

    const rows = await this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        branch: {
          organizationId,
          isActive: true,
          organization: { isActive: true },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        isPublished: true,
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            timezone: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      ...this.paginationArgs(query),
    });

    return this.buildPage(rows, query.limit ?? 50);
  }

  @Get('restaurants/:restaurantId/tables')
  @RequireApiKeyScopes('tables:read')
  async listTables(
    @Req() request: IntegrationRequest,
    @Param('restaurantId') restaurantId: string,
    @Query() query: IntegrationPaginationDto,
  ) {
    const organizationId = this.getOrganizationId(request);

    await this.assertRestaurantAccess(organizationId, restaurantId);

    await this.validateTableCursor(
      organizationId,
      restaurantId,
      query.cursor,
    );

    const rows = await this.prisma.restaurantTable.findMany({
      where: {
        restaurantId,
        isActive: true,
        restaurant: {
          branch: {
            organizationId,
            isActive: true,
            organization: { isActive: true },
          },
        },
      },
      select: {
        id: true,
        tableNumber: true,
        seats: true,
        floorNumber: true,
        roomName: true,
        isAc: true,
        isFamilyFriendly: true,
      },
      orderBy: [
        { floorNumber: 'asc' },
        { tableNumber: 'asc' },
        { id: 'asc' },
      ],
      ...this.paginationArgs(query),
    });

    return this.buildPage(rows, query.limit ?? 50);
  }

  @Get('restaurants/:restaurantId/reservations')
  @RequireApiKeyScopes('reservations:read')
  async listReservations(
    @Req() request: IntegrationRequest,
    @Param('restaurantId') restaurantId: string,
    @Query() query: IntegrationPaginationDto,
  ) {
    const organizationId = this.getOrganizationId(request);

    await this.assertRestaurantAccess(organizationId, restaurantId);

    await this.validateReservationCursor(
      organizationId,
      restaurantId,
      query.cursor,
    );

    const rows = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        restaurant: {
          branch: {
            organizationId,
            isActive: true,
            organization: { isActive: true },
          },
        },
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        guestCount: true,
        status: true,
        seatingPreference: true,
        coolingPreference: true,
        tables: {
          select: {
            table: {
              select: {
                tableNumber: true,
                floorNumber: true,
              },
            },
          },
        },
      },
      orderBy: [
        { startsAt: 'desc' },
        { id: 'desc' },
      ],
      ...this.paginationArgs(query),
    });

    return this.buildPage(rows, query.limit ?? 50);
  }
}
