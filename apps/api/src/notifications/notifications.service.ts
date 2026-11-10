import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FcmService } from './fcm.service.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmService,
  ) {}

  async listForUser(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    const where = { userId };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found.');
      }

      return {
        id: notificationId,
        read: true,
        message: 'Notification was already marked as read.',
      };
    }

    return {
      id: notificationId,
      read: true,
      message: 'Notification marked as read.',
    };
  }

  async createForUser(
    userId: string,
    data: {
      title: string;
      message: string;
      type?: string;
      reservationId?: string;
    },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type ?? 'GENERAL',
        ...(data.reservationId
          ? { reservationId: data.reservationId }
          : {}),
      },
    });

    try {
      await this.fcm.sendToUsers([userId], {
        title: data.title,
        body: data.message,
        data: {
          type: data.type ?? 'GENERAL',
          ...(data.reservationId
            ? { reservationId: data.reservationId }
            : {}),
          notificationId: notification.id,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to send FCM for single notification',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return notification;
  }

  async notifyRestaurantMembersForReservation(
    reservationId: string,
    title: string,
    message: string,
    type: string,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        restaurant: {
          select: {
            name: true,
            branch: {
              select: {
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      return { notified: 0, pushed: 0 };
    }

    const organizationId =
      reservation.restaurant.branch.organizationId;

    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        isActive: true,
        user: {
          status: 'ACTIVE',
        },
      },
      select: {
        userId: true,
      },
    });

    if (members.length === 0) {
      return { notified: 0, pushed: 0 };
    }

    const userIds = members.map((member) => member.userId);

    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        reservationId: reservation.id,
        title,
        message,
        type,
      })),
    });

    let pushed = 0;
    try {
      const pushResult = await this.fcm.sendToUsers(userIds, {
        title,
        body: message,
        data: {
          type,
          reservationId: reservation.id,
        },
      });
      pushed = pushResult.sent;
    } catch (error) {
      this.logger.error(
        'Failed to send FCM for reservation notification',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { notified: result.count, pushed };
  }
}
