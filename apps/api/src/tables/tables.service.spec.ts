
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { TablesService } from './tables.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TablesService', () => {
  const findMembership = vi.fn();
  const findRestaurant = vi.fn();
  const createTable = vi.fn();
  const findTables = vi.fn();
  const findTable = vi.fn();
  const updateTable = vi.fn();

  const findFloor = vi.fn();
  const createFloor = vi.fn();
  const findRoom = vi.fn();
  const createRoom = vi.fn();

  const prisma = {
    organizationMember: { findFirst: findMembership },
    restaurant: { findFirst: findRestaurant },
    floor: { findFirst: findFloor, create: createFloor },
    room: { findFirst: findRoom, create: createRoom },
    restaurantTable: {
      create: createTable,
      findMany: findTables,
      findFirst: findTable,
      update: updateTable,
    },
  } as unknown as PrismaService;

  let service: TablesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new TablesService(prisma);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('denies STAFF from creating a table', async () => {
    findMembership.mockResolvedValue({ role: 'STAFF' });

    await expect(
      service.create('org-a', 'user-staff', 'restaurant-a', {
        tableNumber: 'T1',
        seats: 4,
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(findRestaurant).not.toHaveBeenCalled();
    expect(createTable).not.toHaveBeenCalled();
  });

  it('does not list tables when the restaurant is outside the organization', async () => {
    findRestaurant.mockResolvedValue(null);

    await expect(
      service.findAll('org-a', 'restaurant-b'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findRestaurant).toHaveBeenCalledWith({
      where: {
        id: 'restaurant-b',
        branch: { organizationId: 'org-a' },
      },
      select: { id: true },
    });
    expect(findTables).not.toHaveBeenCalled();
  });

  it('allows OWNER to create a table in their organization', async () => {
    findMembership.mockResolvedValue({ role: 'OWNER' });
    findRestaurant.mockResolvedValue({ id: 'restaurant-a' });
    findFloor.mockResolvedValue({ id: 'floor-1', sortOrder: 1, name: 'Ground' });
    findRoom.mockResolvedValue({ id: 'room-1', name: 'Main' });
    createTable.mockResolvedValue({
      id: 'table-a',
      restaurantId: 'restaurant-a',
      tableNumber: 'T1',
      seats: 4,
    });

    const result = await service.create(
      'org-a',
      'user-owner',
      'restaurant-a',
      { tableNumber: 'T1', seats: 4 } as any,
    );

    expect(result).toMatchObject({
      id: 'table-a',
      restaurantId: 'restaurant-a',
    });
    expect(createTable).toHaveBeenCalledWith({
      data: expect.objectContaining({
        restaurantId: 'restaurant-a',
        tableNumber: 'T1',
        seats: 4,
        floorId: 'floor-1',
        roomId: 'room-1',
        roomName: 'Main',
      }),
    });
  });

  it('does not update a table belonging to another restaurant', async () => {
    findMembership.mockResolvedValue({ role: 'ADMIN' });
    findRestaurant.mockResolvedValue({ id: 'restaurant-a' });
    findTable.mockResolvedValue(null);

    await expect(
      service.update(
        'org-a',
        'user-admin',
        'restaurant-a',
        'table-from-other-restaurant',
        {},
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(updateTable).not.toHaveBeenCalled();
  });
});
