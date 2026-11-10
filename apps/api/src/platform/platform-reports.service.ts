import { BadRequestException, Injectable } from '@nestjs/common';
import { ReservationStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlatformReportQueryDto } from './dto/platform-report-query.dto.js';

@Injectable()
export class PlatformReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const { start, end } = this.kolkataDay();
    const trialLimit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [activeClients, suspendedClients, trialsEndingWithin7Days, pastDue, bookingsToday, seatedToday] =
      await Promise.all([
        this.prisma.organization.count({ where: { isActive: true } }),
        this.prisma.organization.count({ where: { isActive: false } }),
        this.prisma.subscription.count({
          where: {
            status: SubscriptionStatus.TRIALING,
            trialEndsAt: { gte: new Date(), lte: trialLimit },
          },
        }),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.PAST_DUE },
        }),
        this.prisma.reservation.count({
          where: { startsAt: { gte: start, lt: end } },
        }),
        this.prisma.reservation.count({
          where: {
            startsAt: { gte: start, lt: end },
            status: ReservationStatus.SEATED,
          },
        }),
      ]);

    return {
      activeClients,
      suspendedClients,
      trialsEndingWithin7Days,
      pastDue,
      bookingsToday,
      seatedToday,
    };
  }

  async report(query: PlatformReportQueryDto) {
    const range = this.parseRange(query.from, query.to);
    const [newClients, activeClients, suspendedClients, subscriptionGroups, bookingGroups] =
      await Promise.all([
        this.prisma.organization.count({
          where: { createdAt: { gte: range.from, lt: range.to } },
        }),
        this.prisma.organization.count({ where: { isActive: true } }),
        this.prisma.organization.count({ where: { isActive: false } }),
        this.prisma.subscription.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.reservation.groupBy({
          by: ['status'],
          where: { startsAt: { gte: range.from, lt: range.to } },
          _count: { _all: true },
        }),
      ]);

    const subscriptions = this.counts(
      subscriptionGroups,
      Object.values(SubscriptionStatus),
    );
    const bookings = this.counts(bookingGroups, Object.values(ReservationStatus));

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      clients: {
        newInRange: newClients,
        active: activeClients,
        suspended: suspendedClients,
      },
      subscriptions,
      bookings,
    };
  }

  async reportCsv(query: PlatformReportQueryDto) {
    const report = await this.report(query);
    const lines = [
      ['metric', 'value'],
      ['from', report.from],
      ['to', report.to],
      ['clients.newInRange', String(report.clients.newInRange)],
      ['clients.active', String(report.clients.active)],
      ['clients.suspended', String(report.clients.suspended)],
      ...Object.entries(report.subscriptions).map(([key, value]) => [
        `subscriptions.${key}`,
        String(value),
      ]),
      ...Object.entries(report.bookings).map(([key, value]) => [
        `bookings.${key}`,
        String(value),
      ]),
    ];

    return lines
      .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
  }

  private counts<T extends string>(
    groups: { status: T; _count: { _all: number } }[],
    statuses: T[],
  ) {
    const totals = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<T, number>;

    for (const group of groups) {
      totals[group.status] = group._count._all;
    }

    return {
      ...totals,
      total: groups.reduce((sum, group) => sum + group._count._all, 0),
    };
  }

  private parseRange(fromValue: string, toValue: string) {
    const from = new Date(fromValue);
    const to = new Date(toValue);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('The end of the range must be after the start.');
    }

    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('A report range cannot exceed 366 days.');
    }

    return { from, to };
  }

  private kolkataDay(now = new Date()) {
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const start = new Date(`${day}T00:00:00+05:30`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }
}
