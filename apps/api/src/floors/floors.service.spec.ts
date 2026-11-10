import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { FloorsService } from './floors.service.js';

describe('FloorsService', () => {
  const findRestaurant = vi.fn();
  const findFloors = vi.fn();
  const createFloor = vi.fn();

  const prisma = {
    restaurant: { findFirst: findRestaurant },
    floor: { findMany: findFloors, create: createFloor, findFirst: vi.fn() },
  } as unknown as PrismaService;

  let service: FloorsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new FloorsService(prisma);
  });

  it('does not list floors when the restaurant is outside the organization', async () => {
    findRestaurant.mockResolvedValue(null);

    await expect(service.listFloors('org-a', 'restaurant-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findFloors).not.toHaveBeenCalled();
  });

  it('rejects a floor name that already exists', async () => {
    findRestaurant.mockResolvedValue({ id: 'restaurant-a' });
    (prisma.floor.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    createFloor.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createFloor('org-a', 'restaurant-a', { name: 'Ground' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
