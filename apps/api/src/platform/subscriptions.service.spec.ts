import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlatformAuditService } from './platform-audit.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsService', () => {
  const findOrganization = vi.fn();
  const prisma = {
    organization: { findUnique: findOrganization },
    plan: { findUnique: vi.fn() },
    subscription: { findUnique: vi.fn(), create: vi.fn() },
  } as unknown as PrismaService;
  const audit = { write: vi.fn() } as unknown as PlatformAuditService;
  let service: SubscriptionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionsService(prisma, audit);
  });

  it('refuses a second subscription for the same client', async () => {
    findOrganization.mockResolvedValue({
      id: 'org-1',
      name: 'Saffron House',
      subscription: { id: 'sub-1' },
    });

    await expect(
      service.assign('org-1', 'admin-1', { planId: 'plan-1' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });
});
