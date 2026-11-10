import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CoolingPreference,
  SeatingPreference,
} from '@prisma/client';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

describe('ReservationsController', () => {
  let controller: ReservationsController;

  const reservationsServiceMock = {
    availability: vi.fn(),
    createPublicReservation: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: reservationsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(
      ReservationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward availability queries to the service', async () => {
    const expected = {
      restaurant: 'Test Restaurant',
      available: true,
      availableTableCount: 2,
      options: [],
    };

    reservationsServiceMock.availability.mockResolvedValue(expected);

    const query = {
      startsAt: '2027-01-10T12:00:00.000Z',
      endsAt: '2027-01-10T13:00:00.000Z',
      guestCount: 4,
      seatingPreference: undefined,
      coolingPreference: undefined,
    };

    await expect(
      controller.availability('test-restaurant', query),
    ).resolves.toEqual(expected);

    expect(reservationsServiceMock.availability).toHaveBeenCalledWith(
      'test-restaurant',
      query.startsAt,
      query.endsAt,
      query.guestCount,
      undefined,
      undefined,
    );
  });

  it('should forward seating and cooling preferences', async () => {
    reservationsServiceMock.availability.mockResolvedValue({
      available: false,
      availableTableCount: 0,
      options: [],
    });

    const query = {
      startsAt: '2027-01-10T12:00:00.000Z',
      endsAt: '2027-01-10T13:00:00.000Z',
      guestCount: 2,
      seatingPreference: SeatingPreference.FAMILY,
      coolingPreference: CoolingPreference.AC,
    };

    await controller.availability('test-restaurant', query);

    expect(reservationsServiceMock.availability).toHaveBeenCalledWith(
      'test-restaurant',
      query.startsAt,
      query.endsAt,
      query.guestCount,
      SeatingPreference.FAMILY,
      CoolingPreference.AC,
    );
  });

  it('should forward public booking requests to the service', async () => {
    const dto = {
      guestName: 'Test Guest',
      guestPhone: '9876543210',
      startsAt: '2027-01-10T12:00:00.000Z',
      endsAt: '2027-01-10T13:00:00.000Z',
      guestCount: 2,
    } as CreateReservationDto;

    const expected = {
      bookingCode: 'ABC123',
      status: 'PENDING',
      restaurant: 'Test Restaurant',
    };

    reservationsServiceMock.createPublicReservation.mockResolvedValue(
      expected,
    );

    await expect(
      controller.create('test-restaurant', dto),
    ).resolves.toEqual(expected);

    expect(
      reservationsServiceMock.createPublicReservation,
    ).toHaveBeenCalledWith('test-restaurant', dto);
  });
});
