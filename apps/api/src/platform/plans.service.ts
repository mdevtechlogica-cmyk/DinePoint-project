import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { ReplaceEntitlementsDto } from './dto/replace-entitlements.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlatformAuditService } from './platform-audit.service.js';

const planInclude = { entitlements: { orderBy: { key: 'asc' as const } } };

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PlatformAuditService,
  ) {}

  list() {
    return this.prisma.plan.findMany({
      include: planInclude,
      orderBy: [{ isActive: 'desc' }, { monthlyPrice: 'asc' }],
    });
  }

  async create(actorUserId: string, dto: CreatePlanDto) {
    const slug = this.slugify(dto.slug ?? dto.name);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const plan = await tx.plan.create({
          data: {
            name: dto.name.trim(),
            slug,
            description: dto.description?.trim(),
            monthlyPrice: dto.monthlyPrice,
            annualPrice: dto.annualPrice,
            currency: dto.currency?.toUpperCase() ?? 'INR',
            isActive: dto.isActive ?? true,
          },
          include: planInclude,
        });

        await this.audit.write(tx, {
          actorUserId,
          action: 'PLAN_CREATED',
          targetType: 'Plan',
          targetId: plan.id,
          description: `Created plan ${plan.name}.`,
        });

        return plan;
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(planId: string, actorUserId: string, dto: UpdatePlanDto) {
    await this.findPlan(planId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const plan = await tx.plan.update({
          where: { id: planId },
          data: {
            name: dto.name?.trim(),
            slug: dto.slug ? this.slugify(dto.slug) : undefined,
            description: dto.description?.trim(),
            monthlyPrice: dto.monthlyPrice,
            annualPrice: dto.annualPrice,
            currency: dto.currency?.toUpperCase(),
            isActive: dto.isActive,
          },
          include: planInclude,
        });

        await this.audit.write(tx, {
          actorUserId,
          action: 'PLAN_UPDATED',
          targetType: 'Plan',
          targetId: plan.id,
          description: `Updated plan ${plan.name}.`,
        });

        return plan;
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async replaceEntitlements(
    planId: string,
    actorUserId: string,
    dto: ReplaceEntitlementsDto,
  ) {
    await this.findPlan(planId);
    const entitlements = dto.entitlements.map((item) => ({
      key: item.key.trim(),
      value: this.jsonValue(item.value),
    }));

    return this.prisma.$transaction(async (tx) => {
      await tx.planEntitlement.deleteMany({ where: { planId } });

      if (entitlements.length > 0) {
        await tx.planEntitlement.createMany({
          data: entitlements.map((item) => ({
            planId,
            key: item.key,
            value: item.value,
          })),
        });
      }

      const plan = await tx.plan.findUniqueOrThrow({
        where: { id: planId },
        include: planInclude,
      });

      await this.audit.write(tx, {
        actorUserId,
        action: 'PLAN_ENTITLEMENTS_REPLACED',
        targetType: 'Plan',
        targetId: planId,
        description: `Replaced entitlements for ${plan.name}.`,
        metadata: { keys: entitlements.map((item) => item.key) },
      });

      return plan;
    });
  }

  private async findPlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found.');
    }

    return plan;
  }

  private jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === null) {
      return Prisma.JsonNull;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      return value as Prisma.InputJsonValue;
    }

    throw new BadRequestException('Entitlement value must be JSON.');
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);

    return slug || `plan-${randomBytes(2).toString('hex')}`;
  }

  private rethrowUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A plan with this slug already exists.');
    }

    throw error;
  }
}
