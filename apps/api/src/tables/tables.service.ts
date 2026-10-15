import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  
  import { OrganizationRole } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { CreateTableDto } from './dto/create-table.dto.js';
  import { UpdateTableDto } from './dto/update-table.dto.js';
  
  @Injectable()
  export class TablesService {
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
          'Only organization owners and admins can manage tables.',
        );
      }
    }
  
    private async findRestaurant(
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
  
      return restaurant;
    }
  
    async create(
      organizationId: string,
      userId: string,
      restaurantId: string,
      dto: CreateTableDto,
    ) {
      await this.assertCanManage(organizationId, userId);
      await this.findRestaurant(organizationId, restaurantId);
  
      try {
        return await this.prisma.restaurantTable.create({
          data: {
            restaurantId,
            tableNumber: dto.tableNumber,
            seats: dto.seats,
            floorNumber: dto.floorNumber ?? 1,
            roomName: dto.roomName,
            isAc: dto.isAc ?? false,
            isFamilyFriendly: dto.isFamilyFriendly ?? true,
          },
        });
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'This table number already exists in the restaurant.',
          );
        }
  
        throw error;
      }
    }
  
    async findAll(
      organizationId: string,
      restaurantId: string,
    ) {
      await this.findRestaurant(organizationId, restaurantId);
  
      return this.prisma.restaurantTable.findMany({
        where: { restaurantId },
        orderBy: [
          { floorNumber: 'asc' },
          { tableNumber: 'asc' },
        ],
      });
    }
  
    async update(
      organizationId: string,
      userId: string,
      restaurantId: string,
      tableId: string,
      dto: UpdateTableDto,
    ) {
      await this.assertCanManage(organizationId, userId);
      await this.findRestaurant(organizationId, restaurantId);
  
      const table =
        await this.prisma.restaurantTable.findFirst({
          where: {
            id: tableId,
            restaurantId,
          },
          select: { id: true },
        });
  
      if (!table) {
        throw new NotFoundException(
          'Table not found in this restaurant.',
        );
      }
  
      try {
        return await this.prisma.restaurantTable.update({
          where: { id: tableId },
          data: {
            tableNumber: dto.tableNumber,
            seats: dto.seats,
            floorNumber: dto.floorNumber,
            roomName: dto.roomName,
            isAc: dto.isAc,
            isFamilyFriendly: dto.isFamilyFriendly,
            isActive: dto.isActive,
          },
        });
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'This table number already exists in the restaurant.',
          );
        }
  
        throw error;
      }
    }
  }