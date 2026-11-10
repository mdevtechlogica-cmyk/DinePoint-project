import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SubscriptionEventAction,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto.js';
import { pageWindow } from './dto/pagination-query.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';
import { PlatformAuditService } from './platform-audit.service.js';

const subscriptionInclude = {
  plan: { select: { id: true, name: true, slug: true } },
  organization: { select: { id: true, name: true, slug: true, isActive: true } },
} satisfies Prisma.SubscriptionInclude;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PlatformAuditService,
  ) {}

  async list(query: ListSubscriptionsQueryDto) {
    const { page, pageSize, skip } = pageWindow(query.page, query.pageSize);
    const where: Prisma.SubscriptionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
    };

    const [totalCount, rows] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: subscriptionInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { page, pageSize, totalCount, rows };
  }

  async assign(organizationId: string, actorUserId: string, dto: CreateSubscriptionDto) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, subscription: { select: { id: true } } },
    });

    if (!organization) {
      throw new NotFoundException('Client not found.');
    }

    if (organization.subscription) {
      throw new ConflictException('This client already has a subscription.');
    }

    const plan = await this.requireActivePlan(dto.planId);
    const status = dto.status ?? SubscriptionStatus.TRIALING;
    const trialEndsAt = dto.trialEndsAt
      ? new Date(dto.trialEndsAt)
      : status === SubscriptionStatus.TRIALING
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null;

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          organizationId,
          planId: plan.id,
          status,
          trialEndsAt,
          currentPeriodStart: dto.currentPeriodStart
            ? new Date(dto.currentPeriodStart)
            : null,
          currentPeriodEnd: dto.currentPeriodEnd
            ? new Date(dto.currentPeriodEnd)
            : null,
          cancelledAt: status === SubscriptionStatus.CANCELLED ? new Date() : null,
        },
        include: subscriptionInclude,
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          actorUserId,
          action: SubscriptionEventAction.CREATED,
          toStatus: status,
          toPlanId: plan.id,
          note: `Assigned ${plan.name} to ${organization.name}.`,
        },
      });

      await this.audit.write(tx, {
        actorUserId,
        action: 'SUBSCRIPTION_CREATED',
        targetType: 'Subscription',
        targetId: subscription.id,
        description: `Assigned ${plan.name} to ${organization.name}.`,
      });

      return subscription;
    });
  }

  async update(subscriptionId: string, actorUserId: string, dto: UpdateSubscriptionDto) {
    if (
      dto.planId === undefined &&
      dto.status === undefined &&
      dto.trialEndsAt === undefined &&
      dto.currentPeriodStart === undefined &&
      dto.currentPeriodEnd === undefined
    ) {
      throw new BadRequestException('Provide at least one subscription change.');
    }

    const current = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: { select: { id: true, name: true } } },
    });

    if (!current) {
      throw new NotFoundException('Subscription not found.');
    }

    const nextPlan = dto.planId ? await this.requireActivePlan(dto.planId) : current.plan;
    const nextStatus = dto.status ?? current.status;
    const action = this.eventAction(current, dto, nextPlan.id);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: nextPlan.id,
          status: nextStatus,
          trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : undefined,
          currentPeriodStart: dto.currentPeriodStart
            ? new Date(dto.currentPeriodStart)
            : undefined,
          currentPeriodEnd: dto.currentPeriodEnd
            ? new Date(dto.currentPeriodEnd)
            : undefined,
          cancelledAt:
            nextStatus === SubscriptionStatus.CANCELLED
              ? current.cancelledAt ?? new Date()
              : current.status === SubscriptionStatus.CANCELLED
                ? null
                : undefined,
        },
        include: subscriptionInclude,
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId,
          actorUserId,
          action,
          fromStatus: current.status,
          toStatus: nextStatus,
          fromPlanId: current.planId,
          toPlanId: nextPlan.id,
        },
      });

      await this.audit.write(tx, {
        actorUserId,
        action: 'SUBSCRIPTION_UPDATED',
        targetType: 'Subscription',
        targetId: subscriptionId,
        description: `Updated the subscription for ${subscription.organization.name}.`,
      });

      return subscription;
    });
  }

  async events(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    return this.prisma.subscriptionEvent.findMany({
      where: { subscriptionId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        fromPlan: { select: { id: true, name: true } },
        toPlan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireActivePlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found.');
    }

    if (!plan.isActive) {
      throw new ConflictException('This plan is not active.');
    }

    return plan;
  }

  private eventAction(
    current: { status: SubscriptionStatus; planId: string; trialEndsAt: Date | null },
    dto: UpdateSubscriptionDto,
    nextPlanId: string,
  ) {
    const nextStatus = dto.status ?? current.status;

    if (nextStatus === SubscriptionStatus.CANCELLED && current.status !== nextStatus) {
      return SubscriptionEventAction.CANCELLED;
    }

    if (nextPlanId !== current.planId) {
      return SubscriptionEventAction.PLAN_CHANGED;
    }

    if (dto.status && dto.status !== current.status) {
      return SubscriptionEventAction.STATUS_CHANGED;
    }

    if (dto.trialEndsAt) {
      return SubscriptionEventAction.TRIAL_EXTENDED;
    }

    return SubscriptionEventAction.PERIOD_UPDATED;
  }
}
