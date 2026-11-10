import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator.js';
import { PlatformRoleGuard } from './platform-role.guard.js';

describe('PlatformRoleGuard', () => {
  const getAllAndOverride = vi.fn();
  const findUser = vi.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const prisma = { user: { findUnique: findUser } } as unknown as PrismaService;
  const guard = new PlatformRoleGuard(reflector, prisma);

  function createContext(request: Record<string, unknown>) {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getAllAndOverride.mockReturnValue(undefined);
  });

  it('rejects a restaurant user with no platform role', async () => {
    findUser.mockResolvedValue({ platformRole: null, status: 'ACTIVE' });

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects support staff from a super-admin action', async () => {
    getAllAndOverride.mockReturnValue([PlatformRole.SUPER_ADMIN]);
    findUser.mockResolvedValue({
      platformRole: PlatformRole.SUPPORT,
      status: 'ACTIVE',
    });

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(getAllAndOverride).toHaveBeenCalledWith(PLATFORM_ROLES_KEY, expect.any(Array));
  });

  it('allows a super admin to read when no extra role is required', async () => {
    findUser.mockResolvedValue({
      platformRole: PlatformRole.SUPER_ADMIN,
      status: 'ACTIVE',
    });
    const request: Record<string, unknown> = { user: { id: 'user-1' } };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.platformRole).toBe(PlatformRole.SUPER_ADMIN);
  });

  it('requires an authenticated user', async () => {
    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findUser).not.toHaveBeenCalled();
  });
});
