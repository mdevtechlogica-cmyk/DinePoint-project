import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException,ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  OrganizationRole,
  ReservationStatus,
} from '@prisma/client';
import { ReservationsService } from './reservations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('ReservationsService', () => {
  let service: ReservationsService;

  it('should reject a stale status change and not create an event', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
        role: OrganizationRole.STAFF,
    });

    prismaMock.reservation.findFirst.mockResolvedValue({
        id: reservationId,
        restaurantId,
        status: ReservationStatus.PENDING,
    });

    txMock.reservation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
        service.changeStatus(
            organizationId,
            userId,
            restaurantId,
            reservationId,
            ReservationStatus.CONFIRMED,
        ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(txMock.reservationEvent.create).not.toHaveBeenCalled();
});

  const prismaMock = {
    organizationMember: {
      findFirst: vi.fn(),
    },
    restaurant: {
      findFirst: vi.fn(),
    },
    reservation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    restaurantTable: {
      findMany: vi.fn(),
    },
    openingHour: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const notificationsMock = {
    notifyRestaurantMembersForReservation: vi.fn(),
  };

  const txMock = {
    reservation: {
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    reservationEvent: {
      create: vi.fn(),
    },
    reservationTable: {
      create: vi.fn(),
    },
    restaurantTable: {
      findFirst: vi.fn(),
    },
  };

  const organizationId = 'org-1';
  const otherOrganizationId = 'org-2';
  const restaurantId = 'restaurant-1';
  const reservationId = 'reservation-1';
  const userId = 'user-1';

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<unknown>) =>
        callback(txMock),
    );

    const module = await (
      await import('@nestjs/testing')
    ).Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();

    service = module.get(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not list reservations when the restaurant is outside the organization', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue(null);

    await expect(
      service.listForRestaurant(organizationId, restaurantId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.restaurant.findFirst).toHaveBeenCalledWith({
      where: {
        id: restaurantId,
        branch: { organizationId },
      },
      select: { id: true },
    });

    expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
  });

  it('should scope reservation details to the organization and restaurant', async () => {
    prismaMock.reservation.findFirst.mockResolvedValue(null);

    await expect(
      service.getForRestaurant(
        organizationId,
        restaurantId,
        reservationId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.reservation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: reservationId,
          restaurantId,
          restaurant: {
            branch: { organizationId },
          },
        },
      }),
    );
  });

  it('should reject status changes when the user has no active membership', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(null);

    await expect(
      service.changeStatus(
        organizationId,
        userId,
        restaurantId,
        reservationId,
        ReservationStatus.CONFIRMED,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaMock.organizationMember.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId,
        userId,
        isActive: true,
        organization: { isActive: true },
      },
      select: { role: true },
    });

    expect(prismaMock.reservation.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should not change a reservation belonging to another organization', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      role: OrganizationRole.STAFF,
    });
    prismaMock.reservation.findFirst.mockResolvedValue(null);

    await expect(
      service.changeStatus(
        otherOrganizationId,
        userId,
        restaurantId,
        reservationId,
        ReservationStatus.CONFIRMED,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.reservation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: reservationId,
          restaurantId,
          restaurant: {
            branch: { organizationId: otherOrganizationId },
          },
        },
      }),
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(txMock.reservation.update).not.toHaveBeenCalled();
  });

  it('should allow an active staff member to confirm a pending reservation', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      role: OrganizationRole.STAFF,
    });

    prismaMock.reservation.findFirst.mockResolvedValue({
      id: reservationId,
      restaurantId,
      status: ReservationStatus.PENDING,
    });

    const updatedReservation = {
      id: reservationId,
      restaurantId,
      status: ReservationStatus.CONFIRMED,
    };

    txMock.reservation.updateMany.mockResolvedValue({ count: 1 });
    txMock.reservationEvent.create.mockResolvedValue({ id: 'event-1' });

    const result = await service.changeStatus(
      organizationId,
      userId,
      restaurantId,
      reservationId,
      ReservationStatus.CONFIRMED,
    );

    expect(result).toEqual(updatedReservation);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(txMock.reservation.updateMany).toHaveBeenCalledWith({
    where: {
        id: reservationId,
        restaurantId,
        status: ReservationStatus.PENDING,
        restaurant: {
            branch: {
                organizationId,
            },
        },
    },
    data: {
        status: ReservationStatus.CONFIRMED,
    },
});

    expect(txMock.reservationEvent.create).toHaveBeenCalledWith({
      data: {
        reservationId,
        eventType: 'STATUS_CONFIRMED',
        description: 'Status changed from PENDING to CONFIRMED',
        actorUserId: userId,
      },
    });
  });

  it('should reject invalid reservation status transitions', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      role: OrganizationRole.MANAGER,
    });

    prismaMock.reservation.findFirst.mockResolvedValue({
      id: reservationId,
      restaurantId,
      status: ReservationStatus.COMPLETED,
    });

    await expect(
      service.changeStatus(
        organizationId,
        userId,
        restaurantId,
        reservationId,
        ReservationStatus.CONFIRMED,
      ),
    ).rejects.toThrow(
      'Cannot change reservation from COMPLETED to CONFIRMED.',
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should reject customer lookup when the phone number does not match', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      id: reservationId,
      bookingCode: 'ABC123',
      guestPhone: '+91 98765 43210',
    });

    await expect(
      service.lookupCustomerReservation({
        bookingCode: 'ABC123',
        guestPhone: '9999999999',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should allow customer lookup when formatted phone numbers match', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      id: reservationId,
      bookingCode: 'ABC123',
      guestPhone: '+91 98765 43210',
      status: ReservationStatus.CONFIRMED,
      restaurant: { name: 'Test Restaurant' },
      startsAt: new Date('2027-01-10T12:00:00Z'),
      endsAt: new Date('2027-01-10T13:00:00Z'),
      guestName: 'Test Guest',
      guestCount: 2,
      seatingPreference: 'ANY',
      coolingPreference: 'ANY',
      specialRequests: null,
      tables: [],
    });

    const result = await service.lookupCustomerReservation({
      bookingCode: ' abc123 ',
      guestPhone: '919876543210',
    });

    expect(result.bookingCode).toBe('ABC123');
    expect(result.status).toBe(ReservationStatus.CONFIRMED);
    expect(prismaMock.reservation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingCode: 'ABC123' },
      }),
    );
  });

  it('should reject customer cancellation when the reservation is already completed', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      id: reservationId,
      bookingCode: 'ABC123',
      guestPhone: '9876543210',
      status: ReservationStatus.COMPLETED,
    });

    await expect(
      service.cancelCustomerReservation({
        bookingCode: 'ABC123',
        guestPhone: '9876543210',
      }),
    ).rejects.toThrow(/cannot be cancelled/i);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should reject cancellation if the reservation status changes concurrently', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      id: reservationId,
      bookingCode: 'ABC123',
      guestPhone: '9876543210',
      status: ReservationStatus.PENDING,
    });

    txMock.reservation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.cancelCustomerReservation({
        bookingCode: 'ABC123',
        guestPhone: '9876543210',
      }),
    ).rejects.toThrow(/status has changed/i);

    expect(txMock.reservation.updateMany).toHaveBeenCalledWith({
      where: {
        id: reservationId,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
          ],
        },
      },
      data: { status: ReservationStatus.CANCELLED },
    });

    expect(txMock.reservationEvent.create).not.toHaveBeenCalled();
  });

  it('should cancel a pending reservation and record a cancellation event', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({
      id: reservationId,
      bookingCode: 'ABC123',
      guestPhone: '9876543210',
      status: ReservationStatus.PENDING,
    });

    txMock.reservation.updateMany.mockResolvedValue({ count: 1 });
    txMock.reservationEvent.create.mockResolvedValue({ id: 'event-2' });

    const result = await service.cancelCustomerReservation({
      bookingCode: 'ABC123',
      guestPhone: '9876543210',
    });

    expect(result).toEqual({
      bookingCode: 'ABC123',
      status: ReservationStatus.CANCELLED,
      message: 'Reservation cancelled successfully.',
    });

    expect(txMock.reservationEvent.create).toHaveBeenCalledWith({
      data: {
        reservationId,
        eventType: 'STATUS_CANCELLED',
        description: 'Cancelled through customer booking lookup',
      },
    });
  });

  it('rejects a walk-in when the table is not in the restaurant', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      role: OrganizationRole.STAFF,
    });
    prismaMock.restaurant.findFirst.mockResolvedValue({ id: restaurantId });
    txMock.restaurantTable.findFirst.mockResolvedValue(null);

    await expect(
      service.createWalkIn(organizationId, userId, restaurantId, {
        guestName: 'Ananya Nair',
        guestPhone: '9847011223',
        guestCount: 4,
        tableId: 'missing-table',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(txMock.reservation.create).not.toHaveBeenCalled();
  });

  it('rejects a report range that does not move forward', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue({ id: restaurantId });

    await expect(
      service.reportForRestaurant(organizationId, restaurantId, {
        from: '2026-10-22T00:00:00.000Z',
        to: '2026-10-22T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

