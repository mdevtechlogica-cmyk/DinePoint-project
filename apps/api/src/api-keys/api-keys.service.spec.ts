
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

import { ApiKeysService } from './api-keys.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ApiKeysService', () => {
  const prisma = {
    organization: {
      findFirst: vi.fn(),
    },
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  let service: ApiKeysService;

  const hash = (key: string) =>
    createHash('sha256').update(key, 'utf8').digest('hex');

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ApiKeysService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('stores a hash rather than the raw key and returns the key once', async () => {
      prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      prisma.apiKey.create.mockImplementation(async (args: any) => ({
        id: 'key-1',
        name: args.data.name,
        keyPrefix: args.data.keyPrefix,
        scopes: args.data.scopes,
        expiresAt: args.data.expiresAt,
        createdAt: new Date(),
      }));

      const result = await service.create('org-1', 'user-1', {
        name: ' AI connector ',
        scopes: ['restaurants:read'],
      });

      expect(result.apiKey).toMatch(/^dp_live_/);
      expect(result.apiKey).toHaveLength(8 + 43);
      expect(result.name).toBe('AI connector');

      const saved = prisma.apiKey.create.mock.calls[0][0].data;

      expect(saved.keyHash).toBe(hash(result.apiKey));
      expect(saved.keyHash).not.toBe(result.apiKey);
      expect(saved).not.toHaveProperty('apiKey');
      expect(saved.organizationId).toBe('org-1');
      expect(saved.createdByUserId).toBe('user-1');
      expect(saved.scopes).toEqual(['restaurants:read']);
      expect(result.warning).toContain('cannot be retrieved again');
    });

    it('removes duplicate scopes before saving', async () => {
      prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      prisma.apiKey.create.mockImplementation(async (args: any) => ({
        id: 'key-1',
        ...args.data,
        createdAt: new Date(),
      }));

      await service.create('org-1', 'user-1', {
        name: 'Duplicate scopes',
        scopes: ['restaurants:read', 'restaurants:read'],
      });

      expect(prisma.apiKey.create.mock.calls[0][0].data.scopes)
        .toEqual(['restaurants:read']);
    });

    it('rejects an inactive or missing organization', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org-1', 'user-1', {
          name: 'Connector',
          scopes: ['restaurants:read'],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.apiKey.create).not.toHaveBeenCalled();
    });

    it('rejects an expiry date in the past', async () => {
      prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });

      await expect(
        service.create('org-1', 'user-1', {
          name: 'Expired connector',
          scopes: ['restaurants:read'],
          expiresAt: '2020-01-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.apiKey.create).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    const rawKey = `dp_live_${'a'.repeat(43)}`;

    const activeRecord = {
      id: 'key-1',
      organizationId: 'org-1',
      scopes: ['restaurants:read'],
      expiresAt: null,
      revokedAt: null,
      organization: { isActive: true },
    };

    it('rejects malformed keys without querying the database', async () => {
      expect(await service.authenticate('not-a-key')).toBeNull();
      expect(await service.authenticate('')).toBeNull();

      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it('authenticates a valid key using its hash and records usage', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(activeRecord);
      prisma.apiKey.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.authenticate(rawKey)).resolves.toEqual({
        id: 'key-1',
        organizationId: 'org-1',
        scopes: ['restaurants:read'],
      });

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash: hash(rawKey) },
        select: expect.any(Object),
      });

      expect(prisma.apiKey.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'key-1',
            revokedAt: null,
          }),
          data: { lastUsedAt: expect.any(Date) },
        }),
      );
    });

    it.each([
      ['unknown key', null],
      ['revoked key', { ...activeRecord, revokedAt: new Date() }],
      [
        'expired key',
        { ...activeRecord, expiresAt: new Date(Date.now() - 60_000) },
      ],
      [
        'inactive organization',
        { ...activeRecord, organization: { isActive: false } },
      ],
    ])('rejects an %s', async (_label, record) => {
      prisma.apiKey.findUnique.mockResolvedValue(record);

      await expect(service.authenticate(rawKey)).resolves.toBeNull();
      expect(prisma.apiKey.updateMany).not.toHaveBeenCalled();
    });

    it('rejects authentication if the conditional usage update fails', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(activeRecord);
      prisma.apiKey.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.authenticate(rawKey)).resolves.toBeNull();
    });
  });

  describe('revoke', () => {
    it('revokes only a key belonging to the requested organization', async () => {
      prisma.apiKey.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.revoke('org-1', 'key-1')).resolves.toEqual({
        success: true,
      });

      expect(prisma.apiKey.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'key-1',
          organizationId: 'org-1',
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('returns not found when the key is missing, already revoked, or belongs to another organization', async () => {
      prisma.apiKey.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.revoke('org-1', 'key-1'))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('never selects the stored key hash or raw key', async () => {
      prisma.apiKey.findMany.mockResolvedValue([]);

      await service.list('org-1');

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          expiresAt: true,
          revokedAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });
    });
  });
});
