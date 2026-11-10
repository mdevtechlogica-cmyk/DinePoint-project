import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRole, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';

const employeeSelect = {
  id: true,
  role: true,
  isActive: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    },
  },
} satisfies Prisma.OrganizationMemberSelect;

type EmployeeRecord = Prisma.OrganizationMemberGetPayload<{
  select: typeof employeeSelect;
}>;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(member: EmployeeRecord) {
    return {
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      phone: member.user.phone,
      status: member.user.status,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt,
    };
  }

  private async actorRole(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        isActive: true,
      },
      select: { role: true },
    });

    if (
      membership?.role !== OrganizationRole.OWNER &&
      membership?.role !== OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only organization owners and admins can manage employees.',
      );
    }

    return membership.role;
  }

  private async assertOwnerCanChange(organizationId: string, memberId: string, next: UpdateEmployeeDto) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
      select: { role: true, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Employee not found in this organization.');
    }

    const removesOwner =
      member.role === OrganizationRole.OWNER &&
      member.isActive &&
      (next.isActive === false ||
        (next.role !== undefined && next.role !== OrganizationRole.OWNER));

    if (!removesOwner) {
      return;
    }

    const activeOwners = await this.prisma.organizationMember.count({
      where: {
        organizationId,
        role: OrganizationRole.OWNER,
        isActive: true,
      },
    });

    if (activeOwners <= 1) {
      throw new ConflictException('The organization must keep one active owner.');
    }
  }

  async list(organizationId: string, query: ListEmployeesQueryDto) {
    const search = query.search?.trim();

    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        ...(query.isActive === undefined
          ? {}
          : { isActive: query.isActive === 'true' }),
        ...(query.role ? { role: query.role } : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      select: employeeSelect,
      orderBy: { user: { name: 'asc' } },
    });

    return members.map((member) => this.toResponse(member));
  }

  async create(organizationId: string, userId: string, dto: CreateEmployeeDto) {
    const actor = await this.actorRole(organizationId, userId);

    if (dto.role === OrganizationRole.OWNER && actor !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only an owner can assign the owner role.');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);

    try {
      const member = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email,
            phone: dto.phone.trim(),
            passwordHash,
          },
          select: { id: true },
        });

        return tx.organizationMember.create({
          data: {
            organizationId,
            userId: user.id,
            role: dto.role,
          },
          select: employeeSelect,
        });
      });

      return this.toResponse(member);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async update(
    organizationId: string,
    userId: string,
    memberId: string,
    dto: UpdateEmployeeDto,
  ) {
    const actor = await this.actorRole(organizationId, userId);
    await this.assertOwnerCanChange(organizationId, memberId, dto);

    if (dto.role === OrganizationRole.OWNER && actor !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only an owner can assign the owner role.');
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
      select: { id: true, userId: true },
    });

    if (!member) {
      throw new NotFoundException('Employee not found in this organization.');
    }

    const email = dto.email?.trim().toLowerCase();
    if (email) {
      const taken = await this.prisma.user.findFirst({
        where: {
          email,
          id: { not: member.userId },
        },
        select: { id: true },
      });

      if (taken) {
        throw new ConflictException('An account with this email already exists.');
      }
    }

    const passwordHash = dto.password ? await argon2.hash(dto.password) : undefined;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            name: dto.name?.trim(),
            email,
            phone: dto.phone?.trim(),
            passwordHash,
          },
        });

        return tx.organizationMember.update({
          where: { id: memberId },
          data: {
            role: dto.role,
            isActive: dto.isActive,
          },
          select: employeeSelect,
        });
      });

      return this.toResponse(updated);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }
}
