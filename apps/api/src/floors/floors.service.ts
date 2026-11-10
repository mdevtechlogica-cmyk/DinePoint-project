import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EntitlementsService } from '../entitlements/entitlements.service.js';
import { CreateFloorDto } from './dto/create-floor.dto.js';
import { UpdateFloorDto } from './dto/update-floor.dto.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';

const floorInclude = {
  rooms: {
    orderBy: { name: 'asc' as const },
    include: {
      tables: {
        orderBy: { tableNumber: 'asc' as const },
      },
      _count: { select: { tables: true } },
    },
  },
  _count: { select: { tables: true } },
};

@Injectable()
export class FloorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  private async findRestaurant(organizationId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        branch: { organizationId },
      },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found in this organization.');
    }

    return restaurant;
  }

  private isUniqueConflict(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  async listFloors(organizationId: string, restaurantId: string) {
    await this.findRestaurant(organizationId, restaurantId);

    return this.prisma.floor.findMany({
      where: { restaurantId },
      include: floorInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createFloor(
    organizationId: string,
    restaurantId: string,
    dto: CreateFloorDto,
  ) {
    await this.findRestaurant(organizationId, restaurantId);
    await this.entitlements.assertCanCreateFloor(organizationId, restaurantId);
    const name = dto.name.trim();

    const sortOrder =
      dto.sortOrder ??
      ((
        await this.prisma.floor.findFirst({
          where: { restaurantId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        })
      )?.sortOrder ?? -1) + 1;

    try {
      return await this.prisma.floor.create({
        data: {
          restaurantId,
          name,
          sortOrder,
        },
        include: floorInclude,
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException('A floor with this name already exists.');
      }
      throw error;
    }
  }

  async updateFloor(
    organizationId: string,
    restaurantId: string,
    floorId: string,
    dto: UpdateFloorDto,
  ) {
    await this.findRestaurant(organizationId, restaurantId);
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, restaurantId },
      select: { id: true },
    });

    if (!floor) {
      throw new NotFoundException('Floor not found in this restaurant.');
    }

    try {
      return await this.prisma.floor.update({
        where: { id: floorId },
        data: {
          name: dto.name?.trim(),
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        include: floorInclude,
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException('A floor with this name already exists.');
      }
      throw error;
    }
  }

  async listRooms(organizationId: string, restaurantId: string, floorId: string) {
    await this.findRestaurant(organizationId, restaurantId);
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, restaurantId },
      select: { id: true },
    });

    if (!floor) {
      throw new NotFoundException('Floor not found in this restaurant.');
    }

    return this.prisma.room.findMany({
      where: { floorId },
      include: {
        _count: { select: { tables: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRoom(
    organizationId: string,
    restaurantId: string,
    floorId: string,
    dto: CreateRoomDto,
  ) {
    await this.findRestaurant(organizationId, restaurantId);
    await this.entitlements.assertCanCreateRoom(organizationId, restaurantId);
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, restaurantId },
      select: { id: true },
    });

    if (!floor) {
      throw new NotFoundException('Floor not found in this restaurant.');
    }

    try {
      return await this.prisma.room.create({
        data: {
          floorId,
          name: dto.name.trim(),
        },
        include: {
          _count: { select: { tables: true } },
        },
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException('A room with this name already exists on this floor.');
      }
      throw error;
    }
  }

  async updateRoom(
    organizationId: string,
    restaurantId: string,
    floorId: string,
    roomId: string,
    dto: UpdateRoomDto,
  ) {
    await this.findRestaurant(organizationId, restaurantId);
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        floorId,
        floor: { restaurantId },
      },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found on this floor.');
    }

    try {
      const updated = await this.prisma.room.update({
        where: { id: roomId },
        data: {
          name: dto.name?.trim(),
          isActive: dto.isActive,
        },
        include: {
          _count: { select: { tables: true } },
        },
      });

      if (dto.name) {
        await this.prisma.restaurantTable.updateMany({
          where: { roomId },
          data: { roomName: updated.name },
        });
      }

      return updated;
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException('A room with this name already exists on this floor.');
      }
      throw error;
    }
  }
}
