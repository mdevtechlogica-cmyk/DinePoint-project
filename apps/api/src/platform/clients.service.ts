import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListClientsQueryDto } from './dto/list-clients-query.dto.js';
import { pageWindow } from './dto/pagination-query.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { PlatformAuditService } from './platform-audit.service.js';

const clientListSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  subscription: {
    select: {
      id: true,
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      plan: { select: { id: true, name: true, slug: true } },
    },
  },
  memberships: {
    where: { role: OrganizationRole.OWNER },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: { select: { branches: true } },
} satisfies Prisma.OrganizationSelect;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PlatformAuditService,
  ) {}

  async list(query: ListClientsQueryDto) {
    const search = query.search?.trim();
    const { page, pageSize, skip } = pageWindow(query.page, query.pageSize);
    const where: Prisma.OrganizationWhereInput = {
      ...(query.status === 'active'
        ? { isActive: true }
        : query.status === 'suspended'
          ? { isActive: false }
          : {}),
      ...(query.planId ? { subscription: { planId: query.planId } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              {
                memberships: {
                  some: {
                    role: OrganizationRole.OWNER,
                    user: { email: { contains: search, mode: 'insensitive' } },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [totalCount, rows] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        select: clientListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      page,
      pageSize,
      totalCount,
      rows: rows.map((row) => this.toListItem(row)),
    };
  }

  async getOne(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: {
            plan: {
              include: { entitlements: true },
            },
          },
        },
        memberships: {
          where: { role: OrganizationRole.OWNER },
          select: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        branches: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            city: true,
            isActive: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                isPublished: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Client not found.');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      owners: organization.memberships.map((member) => member.user),
      subscription: organization.subscription,
      outlets: organization.branches.map((branch) => ({
        branchId: branch.id,
        branchName: branch.name,
        city: branch.city,
        isActive: branch.isActive,
        restaurant: branch.restaurant,
      })),
    };
  }

  async update(organizationId: string, actorUserId: string, dto: UpdateClientDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException('Client not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id: organizationId },
        data: { isActive: dto.isActive },
        select: { id: true, name: true, slug: true, isActive: true },
      });

      await this.audit.write(tx, {
        actorUserId,
        action: dto.isActive ? 'CLIENT_RESTORED' : 'CLIENT_SUSPENDED',
        targetType: 'Organization',
        targetId: organizationId,
        description: `${updated.name} is now ${dto.isActive ? 'active' : 'suspended'}.`,
      });

      return updated;
    });
  }

  private toListItem(
    row: Prisma.OrganizationGetPayload<{ select: typeof clientListSelect }>,
  ) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.isActive,
      createdAt: row.createdAt,
      outletCount: row._count.branches,
      owners: row.memberships.map((member) => member.user),
      subscription: row.subscription,
    };
  }
}
