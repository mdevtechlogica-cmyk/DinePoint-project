import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployeesService } from './employees.service.js';

describe('EmployeesService', () => {
  const findMember = vi.fn();
  const findUser = vi.fn();
  const countMembers = vi.fn();

  const prisma = {
    organizationMember: {
      findFirst: findMember,
      findMany: vi.fn(),
      count: countMembers,
      create: vi.fn(),
    },
    user: {
      findUnique: findUser,
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaService;

  let service: EmployeesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new EmployeesService(prisma);
  });

  it('refuses a staff member from creating an employee', async () => {
    findMember.mockResolvedValue({ role: OrganizationRole.STAFF });

    await expect(
      service.create('org-a', 'staff-user', {
        name: 'Nisha Joseph',
        email: 'nisha@saffronhouse.in',
        phone: '9746018832',
        role: OrganizationRole.STAFF,
        password: 'Nisha#18832',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(findUser).not.toHaveBeenCalled();
  });

  it('rejects an email that is already registered', async () => {
    findMember.mockResolvedValue({ role: OrganizationRole.OWNER });
    findUser.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.create('org-a', 'owner-user', {
        name: 'Nisha Joseph',
        email: 'suresh@saffronhouse.in',
        phone: '9746018832',
        role: OrganizationRole.STAFF,
        password: 'Nisha#18832',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to deactivate the last owner', async () => {
    findMember
      .mockResolvedValueOnce({ role: OrganizationRole.OWNER })
      .mockResolvedValueOnce({ role: OrganizationRole.OWNER, isActive: true });
    countMembers.mockResolvedValue(1);

    await expect(
      service.update('org-a', 'owner-user', 'member-owner', { isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(countMembers).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-a',
        role: OrganizationRole.OWNER,
        isActive: true,
      },
    });
  });
});
