import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      findMany: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const tx = {
    user: {
      create: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
    organizationMember: {
      create: vi.fn(),
    },
  };

  const jwtService = {
    signAsync: vi.fn(),
  };

  const configService = {
    get: vi.fn(),
  };

  const registeredUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const organization = {
    id: 'org-1',
    name: 'DinePoint Restaurant',
    slug: 'dinepoint-restaurant-abc123',
  };

  const activeUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'prt-1' });

    tx.user.create.mockResolvedValue(registeredUser);
    tx.organization.create.mockResolvedValue(organization);
    tx.organizationMember.create.mockResolvedValue({ id: 'membership-1' });

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    );

    vi.mocked(argon2.hash).mockResolvedValue('hashed-password');
    vi.mocked(argon2.verify).mockResolvedValue(true);

    jwtService.signAsync.mockResolvedValue('test-access-token');
    configService.get.mockReturnValue('7d');

    const mailService = {
      sendPasswordReset: vi.fn().mockResolvedValue({
        delivered: false,
        link: 'dinepoint://reset-password?token=x',
      }),
      isConfigured: false,
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      mailService as never,
    );
  });

  describe('register', () => {
    const dto = {
      name: '  Test User  ',
      email: '  TEST@EXAMPLE.COM ',
      password: 'Password123!',
      organizationName: '  DinePoint Restaurant  ',
    };

    it('registers a user, organization, and OWNER membership', async () => {
      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true },
      });

      expect(argon2.hash).toHaveBeenCalledWith('Password123!');

      expect(tx.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          passwordHash: 'hashed-password',
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      expect(tx.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'DinePoint Restaurant',
          slug: expect.stringMatching(/^dinepoint-restaurant-[a-f0-9]{6}$/),
        },
        select: { id: true, name: true, slug: true },
      });

      expect(tx.organizationMember.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          organizationId: 'org-1',
          role: 'OWNER',
        },
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Account registered successfully',
        user: registeredUser,
        organization,
        accessToken: 'test-access-token',
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: '7d',
        expiresInSeconds: 604800,
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('rejects an email that is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(argon2.hash).not.toHaveBeenCalled();
    });

    it('converts a Prisma P2002 error into a conflict response', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });

      await expect(service.register(dto)).rejects.toThrow(
        'An account with these details already exists',
      );
    });

    it('rethrows unexpected transaction errors', async () => {
      const error = new Error('Database unavailable');
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.register(dto)).rejects.toBe(error);
    });

    it('uses the default token expiry when configuration is missing', async () => {
      configService.get.mockImplementation((_key: string, defaultValue?: string) => defaultValue);

      const result = await service.register(dto);

      expect(result.expiresIn).toBe('7d');
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_ACCESS_EXPIRES_IN',
        '7d',
      );
    });
  });

  describe('login', () => {
    const dto = {
      email: '  TEST@EXAMPLE.COM ',
      password: 'Password123!',
    };

    it('logs in an active user and returns memberships', async () => {
      const memberships = [
        {
          organizationId: 'org-1',
          role: 'OWNER',
          organization: {
            name: 'DinePoint Restaurant',
            slug: 'dinepoint-restaurant',
          },
        },
      ];

      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.organizationMember.findMany.mockResolvedValue(memberships);

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        'hashed-password',
        'Password123!',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
      expect(prisma.organizationMember.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
          organization: { isActive: true },
        },
        select: {
          organizationId: true,
          role: true,
          organization: {
            select: { name: true, slug: true },
          },
        },
      });

      expect(result).toEqual({
        message: 'Login successful',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
        memberships,
        accessToken: 'test-access-token',
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: '7d',
        expiresInSeconds: 604800,
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(argon2.verify).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        status: 'INACTIVE',
      });

      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );

      expect(argon2.verify).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an incorrect password', async () => {
      vi.mocked(argon2.verify).mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(activeUser);

      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('does not issue a token when password verification fails', async () => {
      vi.mocked(argon2.verify).mockRejectedValue(
        new Error('Password verification failed'),
      );
      prisma.user.findUnique.mockResolvedValue(activeUser);

      await expect(service.login(dto)).rejects.toThrow(
        'Password verification failed',
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});

