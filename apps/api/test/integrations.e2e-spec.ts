import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { IntegrationsController } from '../src/integrations/integrations.controller.js';
import { ApiKeyAuthGuard } from '../src/api-keys/guards/api-key-auth.guard.js';
import { ApiKeysService } from '../src/api-keys/api-keys.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Integrations API (HTTP e2e)', () => {
  let app: INestApplication;


  const apiKeysMock = {
    authenticate: vi.fn(),
  };


  const prismaMock = {
    restaurant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    restaurantTable: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    reservation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };


  const validKey = {
    id: 'key-1',
    organizationId: 'org-1',
    scopes: ['restaurants:read', 'tables:read', 'reservations:read'],
  };


  beforeEach(async () => {
    vi.clearAllMocks();

    apiKeysMock.authenticate.mockResolvedValue(validKey);

    prismaMock.restaurant.findMany.mockResolvedValue([
      {
        id: 'restaurant-1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        city: 'Kochi',
        branch: { id: 'branch-1', name: 'Main Branch' },
      },
    ]);

    prismaMock.restaurant.findFirst.mockResolvedValue({
      id: 'restaurant-1',
    });

    prismaMock.restaurantTable.findMany.mockResolvedValue([
      {
        id: 'table-1',
        tableNumber: 'T1',
        seats: 4,
        floorNumber: 0,
        roomName: null,
        isAc: true,
        isFamilyFriendly: true,
      },
    ]);

    prismaMock.restaurantTable.findFirst.mockResolvedValue({
      id: 'table-1',
    });

    prismaMock.reservation.findMany.mockResolvedValue([
      {
        id: 'reservation-1',
        startsAt: new Date('2026-11-01T12:00:00.000Z'),
        endsAt: new Date('2026-11-01T13:00:00.000Z'),
        guestCount: 2,
        status: 'CONFIRMED',
        seatingPreference: null,
        coolingPreference: null,
        tables: [],
      },
    ]);

    prismaMock.reservation.findFirst.mockResolvedValue({
      id: 'reservation-1',
    });

    const moduleFixture = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        ApiKeyAuthGuard,
        {
          provide: ApiKeysService,
          useValue: apiKeysMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
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


  it('rejects a request without an API key', async () => {
    await request(app.getHttpServer())
      .get('/api/integrations/restaurants')
      .expect(401);

    expect(apiKeysMock.authenticate).not.toHaveBeenCalled();
  });


  it('rejects an invalid API key', async () => {
    apiKeysMock.authenticate.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/api/integrations/restaurants')
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(401);
  });


  it('rejects a key without the required scope', async () => {
    apiKeysMock.authenticate.mockResolvedValue({
      ...validKey,
      scopes: ['tables:read'],
    });

    await request(app.getHttpServer())
      .get('/api/integrations/restaurants')
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(403);

    expect(prismaMock.restaurant.findMany).not.toHaveBeenCalled();
  });


  it('lists restaurants only within the API key organization', async () => {
    await request(app.getHttpServer())
      .get('/api/integrations/restaurants')
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].id).toBe('restaurant-1');
        expect(body.nextCursor).toBeNull();
      });

    expect(prismaMock.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          branch: {
            organizationId: 'org-1',
            isActive: true,
            organization: { isActive: true },
          },
        },
      }),
    );
  });


  it('returns 404 when the restaurant is outside the key organization', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/api/integrations/restaurants/other-restaurant/tables')
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(404);

    expect(prismaMock.restaurantTable.findMany).not.toHaveBeenCalled();
  });


  it('returns reservations without guest contact details', async () => {
    await request(app.getHttpServer())
      .get('/api/integrations/restaurants/restaurant-1/reservations')
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);

        expect(body.data[0]).not.toHaveProperty('guestName');
        expect(body.data[0]).not.toHaveProperty('guestPhone');
        expect(body.data[0]).not.toHaveProperty('guestEmail');

        expect(body.nextCursor).toBeNull();
      });

    expect(prismaMock.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          restaurantId: 'restaurant-1',
          restaurant: {
            branch: {
              organizationId: 'org-1',
              isActive: true,
              organization: { isActive: true },
            },
          },
        },
        select: expect.not.objectContaining({
          guestName: true,
          guestPhone: true,
          guestEmail: true,
        }),
      }),
    );
  });


  it('paginates restaurants without duplicating records', async () => {
    const restaurants = [
      {
        id: 'restaurant-1',
        name: 'Alpha',
        slug: 'alpha',
        city: 'Kochi',
        branch: { id: 'branch-1', name: 'Main Branch' },
      },
      {
        id: 'restaurant-2',
        name: 'Beta',
        slug: 'beta',
        city: 'Kochi',
        branch: { id: 'branch-1', name: 'Main Branch' },
      },
      {
        id: 'restaurant-3',
        name: 'Gamma',
        slug: 'gamma',
        city: 'Kochi',
        branch: { id: 'branch-1', name: 'Main Branch' },
      },
    ];

    prismaMock.restaurant.findMany.mockImplementation(
      async (args: any) => {
        const cursorId = args.cursor?.id as string | undefined;
        const cursorIndex = cursorId
          ? restaurants.findIndex((restaurant) => restaurant.id === cursorId)
          : -1;

        const startIndex = cursorId
          ? cursorIndex + (args.skip ?? 0)
          : 0;

        if (cursorId && cursorIndex === -1) {
          return [];
        }

        return restaurants.slice(
          startIndex,
          startIndex + args.take,
        );
      },
    );

    const auth = `Bearer dp_live_${'a'.repeat(43)}`;

    const firstPage = await request(app.getHttpServer())
      .get('/api/integrations/restaurants?limit=2')
      .set('Authorization', auth)
      .expect(200);

    expect(firstPage.body.data.map((item: any) => item.id)).toEqual([
      'restaurant-1',
      'restaurant-2',
    ]);
    expect(firstPage.body.nextCursor).toBe('restaurant-2');

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/integrations/restaurants?limit=2&cursor=${firstPage.body.nextCursor}`,
      )
      .set('Authorization', auth)
      .expect(200);

    expect(secondPage.body.data.map((item: any) => item.id)).toEqual([
      'restaurant-3',
    ]);
    expect(secondPage.body.nextCursor).toBeNull();

    const allIds = [
      ...firstPage.body.data,
      ...secondPage.body.data,
    ].map((item: any) => item.id);

    expect(new Set(allIds).size).toBe(allIds.length);
  });


  it.each(['0', '101', 'abc'])(
    'rejects an invalid pagination limit: %s',
    async (limit) => {
      await request(app.getHttpServer())
        .get(`/api/integrations/restaurants?limit=${limit}`)
        .set(
          'Authorization',
          `Bearer dp_live_${'a'.repeat(43)}`,
        )
        .expect(400);
    },
  );


  it('returns an empty page for a cursor that does not exist', async () => {
    prismaMock.restaurant.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get(
        '/api/integrations/restaurants?limit=2&cursor=deleted-restaurant',
      )
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
        expect(body.nextCursor).toBeNull();
      });
  });


  it('keeps reservation contact details excluded when paginating', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([
      {
        id: 'reservation-2',
        startsAt: new Date('2026-11-02T12:00:00.000Z'),
        endsAt: new Date('2026-11-02T13:00:00.000Z'),
        guestCount: 2,
        status: 'CONFIRMED',
        seatingPreference: null,
        coolingPreference: null,
        tables: [],
      },
    ]);

    await request(app.getHttpServer())
      .get(
        '/api/integrations/restaurants/restaurant-1/reservations?limit=1',
      )
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).not.toHaveProperty('guestName');
        expect(body.data[0]).not.toHaveProperty('guestPhone');
        expect(body.data[0]).not.toHaveProperty('guestEmail');
      });

    expect(prismaMock.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
        where: expect.objectContaining({
          restaurantId: 'restaurant-1',
        }),
        select: expect.not.objectContaining({
          guestName: true,
          guestPhone: true,
          guestEmail: true,
        }),
      }),
    );
  });


  it('paginates tables without duplicates and preserves organization filters', async () => {
    const tables = [
      {
        id: 'table-1',
        tableNumber: 'T1',
        seats: 2,
        floorNumber: 0,
        roomName: null,
        isAc: true,
        isFamilyFriendly: true,
      },
      {
        id: 'table-2',
        tableNumber: 'T2',
        seats: 4,
        floorNumber: 0,
        roomName: null,
        isAc: true,
        isFamilyFriendly: true,
      },
      {
        id: 'table-3',
        tableNumber: 'T3',
        seats: 6,
        floorNumber: 1,
        roomName: null,
        isAc: false,
        isFamilyFriendly: true,
      },
    ];

    prismaMock.restaurantTable.findMany.mockImplementation(
      async (args: any) => {
        const cursorId = args.cursor?.id as string | undefined;
        const cursorIndex = cursorId
          ? tables.findIndex((table) => table.id === cursorId)
          : -1;

        if (cursorId && cursorIndex === -1) {
          return [];
        }

        const startIndex = cursorId
          ? cursorIndex + (args.skip ?? 0)
          : 0;

        return tables.slice(startIndex, startIndex + args.take);
      },
    );

    const auth = `Bearer dp_live_${'a'.repeat(43)}`;

    const firstPage = await request(app.getHttpServer())
      .get('/api/integrations/restaurants/restaurant-1/tables?limit=2')
      .set('Authorization', auth)
      .expect(200);

    expect(firstPage.body.data.map((item: any) => item.id)).toEqual([
      'table-1',
      'table-2',
    ]);
    expect(firstPage.body.nextCursor).toBe('table-2');

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/integrations/restaurants/restaurant-1/tables?limit=2&cursor=${firstPage.body.nextCursor}`,
      )
      .set('Authorization', auth)
      .expect(200);

    expect(secondPage.body.data.map((item: any) => item.id)).toEqual([
      'table-3',
    ]);
    expect(secondPage.body.nextCursor).toBeNull();

    const allIds = [
      ...firstPage.body.data,
      ...secondPage.body.data,
    ].map((item: any) => item.id);

    expect(new Set(allIds).size).toBe(allIds.length);

    expect(prismaMock.restaurantTable.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: { id: 'table-2' },
        skip: 1,
        take: 3,
        where: expect.objectContaining({
          restaurantId: 'restaurant-1',
          isActive: true,
          restaurant: {
            branch: {
              organizationId: 'org-1',
              isActive: true,
              organization: { isActive: true },
            },
          },
        }),
      }),
    );
  });


  it('rejects a cursor that does not exist', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue(null);
  
    await request(app.getHttpServer())
      .get(
        '/api/integrations/restaurants?limit=2&cursor=deleted-restaurant',
      )
      .set(
        'Authorization',
        `Bearer dp_live_${'a'.repeat(43)}`,
      )
      .expect(400);
  });

});
