
import {
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service.js';
  
  @Injectable()
  export class NotificationsService {
    constructor(private readonly prisma: PrismaService) {}
  
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
      return this.prisma.notification.create({
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
    return { notified: 0 };
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
    return { notified: 0 };
  }

  const result = await this.prisma.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      reservationId: reservation.id,
      title,
      message,
      type,
    })),
  });

  return { notified: result.count };
}

  }
  