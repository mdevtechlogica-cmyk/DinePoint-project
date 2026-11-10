import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DEFAULT_ENTITLEMENTS,
  EntitlementKeys,
  type ResolvedEntitlements,
} from './entitlement-keys.js';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(organizationId: string): Promise<ResolvedEntitlements> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                entitlements: {
                  select: { key: true, value: true },
                },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    const subscription = organization.subscription;
    const plan =
      subscription &&
      ['TRIALING', 'ACTIVE', 'PAST_DUE'].includes(subscription.status) &&
      subscription.plan.isActive
        ? subscription.plan
        : null;

    const raw: Record<string, unknown> = { ...DEFAULT_ENTITLEMENTS };
    if (plan) {
      for (const row of plan.entitlements) {
        raw[row.key] = row.value;
      }
    }

    return {
      planId: plan?.id ?? null,
      planName: plan?.name ?? 'Starter (default)',
      planSlug: plan?.slug ?? 'starter-default',
      subscriptionStatus: subscription?.status ?? null,
      limits: {
        outlets: this.asLimit(raw[EntitlementKeys.outlets], 1),
        tables: this.asLimit(raw[EntitlementKeys.tables], 10),
        maxFloorsPerRestaurant: this.asLimit(
          raw[EntitlementKeys.maxFloorsPerRestaurant],
          2,
        ),
        maxRoomsPerRestaurant: this.asLimit(
          raw[EntitlementKeys.maxRoomsPerRestaurant],
          4,
        ),
        reportHistoryDays: this.asNonNegativeInt(
          raw[EntitlementKeys.reportHistoryDays],
          7,
        ),
        smsPerMonth: this.asNonNegativeInt(
          raw[EntitlementKeys.smsPerMonth],
          0,
        ),
        whatsappPerMonth: this.asNonNegativeInt(
          raw[EntitlementKeys.whatsappPerMonth],
          0,
        ),
      },
      flags: {
        reports: this.asBool(raw[EntitlementKeys.reports], false),
        adsEnabled: this.asBool(raw[EntitlementKeys.adsEnabled], true),
        employeesEnabled: this.asBool(
          raw[EntitlementKeys.employeesEnabled],
          false,
        ),
        exportReports: this.asBool(raw[EntitlementKeys.exportReports], false),
      },
      raw,
    };
  }

  async getUsage(organizationId: string) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [restaurants, tables, floors, rooms, smsThisMonth, whatsappThisMonth] =
      await Promise.all([
        this.prisma.restaurant.count({
          where: { branch: { organizationId }, isActive: true },
        }),
        this.prisma.restaurantTable.count({
          where: {
            isActive: true,
            restaurant: { branch: { organizationId }, isActive: true },
          },
        }),
        this.prisma.floor.count({
          where: {
            isActive: true,
            restaurant: { branch: { organizationId }, isActive: true },
          },
        }),
        this.prisma.room.count({
          where: {
            isActive: true,
            floor: {
              isActive: true,
              restaurant: { branch: { organizationId }, isActive: true },
            },
          },
        }),
        this.prisma.outboundMessage.count({
          where: {
            organizationId,
            channel: 'SMS',
            createdAt: { gte: monthStart },
          },
        }),
        this.prisma.outboundMessage.count({
          where: {
            organizationId,
            channel: 'WHATSAPP',
            createdAt: { gte: monthStart },
          },
        }),
      ]);

    return {
      restaurants,
      tables,
      floors,
      rooms,
      smsThisMonth,
      whatsappThisMonth,
    };
  }

  async assertCanCreateRestaurant(organizationId: string) {
    const entitlements = await this.resolve(organizationId);
    const count = await this.prisma.restaurant.count({
      where: { branch: { organizationId }, isActive: true },
    });
    this.assertUnderLimit(
      count,
      entitlements.limits.outlets,
      `This plan allows ${entitlements.limits.outlets} restaurant outlet(s). Upgrade to add more.`,
    );
    return entitlements;
  }

  async assertCanCreateFloor(organizationId: string, restaurantId: string) {
    const entitlements = await this.resolve(organizationId);
    const count = await this.prisma.floor.count({
      where: { restaurantId, isActive: true },
    });
    this.assertUnderLimit(
      count,
      entitlements.limits.maxFloorsPerRestaurant,
      `This plan allows ${entitlements.limits.maxFloorsPerRestaurant} floor(s) per restaurant. Upgrade to add more.`,
    );
    return entitlements;
  }

  async assertCanCreateRoom(organizationId: string, restaurantId: string) {
    const entitlements = await this.resolve(organizationId);
    const count = await this.prisma.room.count({
      where: {
        isActive: true,
        floor: { restaurantId, isActive: true },
      },
    });
    this.assertUnderLimit(
      count,
      entitlements.limits.maxRoomsPerRestaurant,
      `This plan allows ${entitlements.limits.maxRoomsPerRestaurant} room(s) per restaurant. Upgrade to add more.`,
    );
    return entitlements;
  }

  async assertCanCreateTable(organizationId: string, restaurantId: string) {
    const entitlements = await this.resolve(organizationId);
    const count = await this.prisma.restaurantTable.count({
      where: { restaurantId, isActive: true },
    });
    this.assertUnderLimit(
      count,
      entitlements.limits.tables,
      `This plan allows ${entitlements.limits.tables} table(s) per restaurant. Upgrade to add more.`,
    );
    return entitlements;
  }

  private assertUnderLimit(current: number, limit: number, message: string) {
    if (limit < 0) return; // unlimited
    if (current >= limit) {
      throw new ForbiddenException(message);
    }
  }

  private asLimit(value: unknown, fallback: number) {
    if (value === -1 || value === '-1') return -1;
    return this.asNonNegativeInt(value, fallback);
  }

  private asNonNegativeInt(value: unknown, fallback: number) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n < 0) return fallback;
    return Math.floor(n);
  }

  private asBool(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  }
}
