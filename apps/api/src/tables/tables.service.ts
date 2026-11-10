import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  
  import { OrganizationRole } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { EntitlementsService } from '../entitlements/entitlements.service.js';
  import { CreateTableDto } from './dto/create-table.dto.js';
  import { UpdateTableDto } from './dto/update-table.dto.js';
  
  @Injectable()
  export class TablesService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly entitlements: EntitlementsService,
    ) {}
  
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
  
    private isUniqueConflict(error: unknown) {
      return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      );
    }

    private async resolveFloor(
      restaurantId: string,
      dto: { floorId?: string; floorNumber?: number },
      currentFloorId?: string,
    ) {
      if (dto.floorId) {
        const floor = await this.prisma.floor.findFirst({
          where: { id: dto.floorId, restaurantId },
        });

        if (!floor) {
          throw new NotFoundException('Floor not found in this restaurant.');
        }

        return floor;
      }

      if (dto.floorNumber === undefined && currentFloorId) {
        const floor = await this.prisma.floor.findFirst({
          where: { id: currentFloorId, restaurantId },
        });

        if (!floor) {
          throw new NotFoundException('Floor not found in this restaurant.');
        }

        return floor;
      }

      const sortOrder = dto.floorNumber ?? 1;
      const existing = await this.prisma.floor.findFirst({
        where: { restaurantId, sortOrder },
      });

      if (existing) {
        return existing;
      }

      const name = sortOrder === 1 ? 'Ground' : `Floor ${sortOrder}`;

      try {
        return await this.prisma.floor.create({
          data: {
            restaurantId,
            name,
            sortOrder,
          },
        });
      } catch (error) {
        if (!this.isUniqueConflict(error)) {
          throw error;
        }

        const floor = await this.prisma.floor.findFirst({
          where: {
            restaurantId,
            OR: [{ sortOrder }, { name }],
          },
        });

        if (!floor) {
          throw error;
        }

        return floor;
      }
    }

    private async resolvePlacement(
      restaurantId: string,
      dto: {
        floorId?: string;
        roomId?: string;
        floorNumber?: number;
        roomName?: string;
      },
      current?: { floorId: string; roomName?: string | null },
    ) {
      if (dto.roomId) {
        const room = await this.prisma.room.findFirst({
          where: {
            id: dto.roomId,
            ...(dto.floorId ? { floorId: dto.floorId } : {}),
            floor: { restaurantId },
          },
          include: { floor: true },
        });

        if (!room) {
          throw new NotFoundException('Room not found in this restaurant.');
        }

        return {
          floorId: room.floorId,
          roomId: room.id,
          floorNumber: room.floor.sortOrder,
          roomName: room.name,
        };
      }

      const floor = await this.resolveFloor(
        restaurantId,
        dto,
        current?.floorId,
      );
      const roomName = dto.roomName?.trim() || current?.roomName?.trim() || 'Main';
      const existingRoom = await this.prisma.room.findFirst({
        where: { floorId: floor.id, name: roomName },
      });

      const room =
        existingRoom ??
        (await this.prisma.room.create({
          data: {
            floorId: floor.id,
            name: roomName,
          },
        }).catch(async (error: unknown) => {
          if (!this.isUniqueConflict(error)) {
            throw error;
          }

          const raced = await this.prisma.room.findFirst({
            where: { floorId: floor.id, name: roomName },
          });

          if (!raced) {
            throw error;
          }

          return raced;
        }));

      return {
        floorId: floor.id,
        roomId: room.id,
        floorNumber: floor.sortOrder,
        roomName: room.name,
      };
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
      await this.entitlements.assertCanCreateTable(organizationId, restaurantId);
  
      const placement = await this.resolvePlacement(restaurantId, dto);

      try {
        return await this.prisma.restaurantTable.create({
          data: {
            restaurantId,
            tableNumber: dto.tableNumber,
            seats: dto.seats,
            isAc: dto.isAc ?? false,
            isFamilyFriendly: dto.isFamilyFriendly ?? true,
            ...placement,
          },
        });
      } catch (error) {
        if (this.isUniqueConflict(error)) {
          throw new ConflictException(
            'This table number already exists in this room.',
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
        include: {
          floor: { select: { id: true, name: true, isActive: true } },
          room: { select: { id: true, name: true, isActive: true } },
        },
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
          select: {
            id: true,
            floorId: true,
            room: { select: { name: true } },
          },
        });

      if (!table) {
        throw new NotFoundException(
          'Table not found in this restaurant.',
        );
      }

      const moves =
        dto.roomId !== undefined ||
        dto.floorId !== undefined ||
        dto.floorNumber !== undefined ||
        dto.roomName !== undefined;
      const placement = moves
        ? await this.resolvePlacement(restaurantId, dto, {
            floorId: table.floorId,
            roomName: table.room.name,
          })
        : undefined;

      try {
        return await this.prisma.restaurantTable.update({
          where: { id: tableId },
          data: {
            tableNumber: dto.tableNumber,
            seats: dto.seats,
            isAc: dto.isAc,
            isFamilyFriendly: dto.isFamilyFriendly,
            isActive: dto.isActive,
            ...placement,
          },
        });
      } catch (error) {
        if (this.isUniqueConflict(error)) {
          throw new ConflictException(
            'This table number already exists in this room.',
          );
        }

        throw error;
      }
    }
  }