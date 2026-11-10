import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ReservationsController } from '../src/reservations/reservations.controller.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';

describe('Public reservations HTTP (e2e)', () => {
  let app: INestApplication;

  const reservationsServiceMock = {
    availability: vi.fn(),
    createPublicReservation: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: reservationsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should serve availability under the /api prefix', async () => {
    reservationsServiceMock.availability.mockResolvedValue({
      restaurant: 'Test Restaurant',
      available: true,
      availableTableCount: 1,
      options: [],
    });

    await request(app.getHttpServer())
      .get('/api/public/restaurants/test-restaurant/availability')
      .query({
        startsAt: '2027-01-10T12:00:00.000Z',
        endsAt: '2027-01-10T13:00:00.000Z',
        guestCount: '2',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.available).toBe(true);
      });

    expect(reservationsServiceMock.availability).toHaveBeenCalledWith(
      'test-restaurant',
      '2027-01-10T12:00:00.000Z',
      '2027-01-10T13:00:00.000Z',
      2,
      undefined,
      undefined,
    );
  });

  it('should reject invalid availability query parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/public/restaurants/test-restaurant/availability')
      .query({
        startsAt: 'not-a-date',
        endsAt: 'also-not-a-date',
        guestCount: 'not-a-number',
      })
      .expect(400);

    expect(reservationsServiceMock.availability).not.toHaveBeenCalled();
  });

  it('should reject booking requests with invalid DTO fields', async () => {
    await request(app.getHttpServer())
      .post('/api/public/restaurants/test-restaurant/reservations')
      .send({
        guestName: 'A',
        guestPhone: '123',
        startsAt: 'invalid',
        endsAt: 'invalid',
        guestCount: 0,
        unexpectedField: true,
      })
      .expect(400);

    expect(
      reservationsServiceMock.createPublicReservation,
    ).not.toHaveBeenCalled();
  });

  it('should return 404 for an unknown route', async () => {
    await request(app.getHttpServer())
      .get('/api/route-that-does-not-exist')
      .expect(404);
  });
});
