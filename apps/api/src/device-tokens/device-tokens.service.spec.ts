import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceTokensService } from './device-tokens.service.js';

describe('DeviceTokensService', () => {
  const prisma = {
    deviceToken: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  };

  let service: DeviceTokensService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeviceTokensService(prisma as never);
  });

  it('registers a device token for the user', async () => {
    prisma.deviceToken.upsert.mockResolvedValue({
      id: 'dt-1',
      token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
      platform: 'ANDROID',
      isActive: true,
      lastUsedAt: new Date('2026-10-27T00:00:00.000Z'),
    });

    const result = await service.register('user-1', {
      token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
      platform: 'ANDROID',
    });

    expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
      where: { token: 'fcm-token-abcdefghijklmnopqrstuvwxyz' },
      create: expect.objectContaining({
        userId: 'user-1',
        token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
        platform: 'ANDROID',
        isActive: true,
      }),
      update: expect.objectContaining({
        userId: 'user-1',
        platform: 'ANDROID',
        isActive: true,
      }),
      select: {
        id: true,
        token: true,
        platform: true,
        isActive: true,
        lastUsedAt: true,
      },
    });
    expect(result.message).toBe('Device token registered');
  });

  it('deactivates a device token for the user', async () => {
    prisma.deviceToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.unregister(
      'user-1',
      'fcm-token-abcdefghijklmnopqrstuvwxyz',
    );

    expect(result.deactivated).toBe(1);
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
        isActive: true,
      },
      data: { isActive: false },
    });
  });
});
