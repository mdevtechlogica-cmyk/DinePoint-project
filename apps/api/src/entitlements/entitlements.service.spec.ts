import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntitlementsService } from './entitlements.service.js';

describe('EntitlementsService', () => {
  const prisma = {
    organization: { findUnique: vi.fn() },
    restaurant: { count: vi.fn() },
    floor: { count: vi.fn() },
    room: { count: vi.fn() },
    restaurantTable: { count: vi.fn() },
  };

  let service: EntitlementsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EntitlementsService(prisma as never);
  });

  it('resolves plan entitlements for an active subscription', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      subscription: {
        status: 'ACTIVE',
        plan: {
          id: 'plan-1',
          name: 'Growth',
          slug: 'growth',
          isActive: true,
          entitlements: [
            { key: 'outlets', value: 3 },
            { key: 'tables', value: 60 },
            { key: 'sms_per_month', value: 200 },
            { key: 'reports', value: true },
          ],
        },
      },
    });

    const resolved = await service.resolve('org-1');
    expect(resolved.planName).toBe('Growth');
    expect(resolved.limits.outlets).toBe(3);
    expect(resolved.limits.tables).toBe(60);
    expect(resolved.limits.smsPerMonth).toBe(200);
    expect(resolved.flags.reports).toBe(true);
  });

  it('blocks creating a restaurant when outlet limit is reached', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      subscription: {
        status: 'ACTIVE',
        plan: {
          id: 'plan-1',
          name: 'Starter',
          slug: 'starter',
          isActive: true,
          entitlements: [{ key: 'outlets', value: 1 }],
        },
      },
    });
    prisma.restaurant.count.mockResolvedValue(1);

    await expect(service.assertCanCreateRestaurant('org-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
