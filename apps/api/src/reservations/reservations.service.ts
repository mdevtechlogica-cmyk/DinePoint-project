import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CoolingPreference,
    Prisma,
    OrganizationRole,
    ReservationSource,
    ReservationStatus,
    SeatingPreference,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CreateWalkInDto } from './dto/create-walk-in.dto.js';
import { ListReservationsQueryDto } from './dto/list-reservations-query.dto.js';
import { ReservationReportQueryDto } from './dto/reservation-report-query.dto.js';
import { LookupReservationDto } from './dto/lookup-reservation.dto.js';
import { CancelReservationDto } from './dto/cancel-reservation.dto.js';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class ReservationsService {
    private readonly logger = new Logger(ReservationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }


    private async getPublicRestaurant(slug: string) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: {
                slug,
                isActive: true,
                isPublished: true,
                branch: {
                    isActive: true,
                    organization: { isActive: true },
                },
            },
            select: {
                id: true,
                name: true,
                branch: {
                    select: {
                        timezone: true,
                    },
                },
            },
        });

        if (!restaurant) {
            throw new NotFoundException(
                'Restaurant not found or not accepting public bookings.',
            );
        }

        return restaurant;
    }


    private validateTime(startsAt: Date, endsAt: Date) {
        if (
            Number.isNaN(startsAt.getTime()) ||
            Number.isNaN(endsAt.getTime()) ||
            startsAt <= new Date() ||
            endsAt <= startsAt
        ) {
            throw new BadRequestException(
                'Provide a future start time and an end time after the start time.',
            );
        }

        const durationMinutes =
            (endsAt.getTime() - startsAt.getTime()) / 60000;

        if (durationMinutes > 240) {
            throw new BadRequestException(
                'A reservation cannot exceed four hours.',
            );
        }
    }

    private buildTableFilter(
        restaurantId: string,
        guestCount: number,
        seatingPreference: SeatingPreference,
        coolingPreference: CoolingPreference,
        startsAt: Date,
        endsAt: Date,
    ): Prisma.RestaurantTableWhereInput {
        return {
            restaurantId,
            isActive: true,
            seats: { gte: guestCount },

            ...(seatingPreference === SeatingPreference.FAMILY
                ? { isFamilyFriendly: true }
                : {}),

            ...(seatingPreference === SeatingPreference.NON_FAMILY
                ? { isFamilyFriendly: false }
                : {}),

            ...(coolingPreference === CoolingPreference.AC
                ? { isAc: true }
                : {}),

            ...(coolingPreference === CoolingPreference.NON_AC
                ? { isAc: false }
                : {}),

            reservations: {
                none: {
                    reservation: {
                        startsAt: { lt: endsAt },
                        endsAt: { gt: startsAt },
                        status: {
                            in: [
                                ReservationStatus.PENDING,
                                ReservationStatus.CONFIRMED,
                                ReservationStatus.SEATED,
                            ],
                        },
                    },
                },
            },
        };
    }

    async availability(
        slug: string,
        startsAtValue: string,
        endsAtValue: string,
        guestCount: number,
        seatingPreference: SeatingPreference = SeatingPreference.ANY,
        coolingPreference: CoolingPreference = CoolingPreference.ANY,
    ) {
        const startsAt = new Date(startsAtValue);
        const endsAt = new Date(endsAtValue);

        this.validateTime(startsAt, endsAt);

        const restaurant = await this.getPublicRestaurant(slug);

        await this.assertWithinOpeningHours(
            restaurant.id,
            restaurant.branch.timezone,
            startsAt,
            endsAt,
        );

        const tables = await this.prisma.restaurantTable.findMany({
            where: this.buildTableFilter(
                restaurant.id,
                guestCount,
                seatingPreference,
                coolingPreference,
                startsAt,
                endsAt,
            ),
            select: {
                seats: true,
                isAc: true,
                isFamilyFriendly: true,
            },
            orderBy: { seats: 'asc' },
        });

        return {
            restaurant: restaurant.name,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            guestCount,
            available: tables.length > 0,
            availableTableCount: tables.length,
            options: tables,
        };
    }

    async createPublicReservation(
        slug: string,
        dto: CreateReservationDto,
    ) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);

        this.validateTime(startsAt, endsAt);

        const restaurant = await this.getPublicRestaurant(slug);

        await this.assertWithinOpeningHours(
            restaurant.id,
            restaurant.branch.timezone,
            startsAt,
            endsAt,
        );

        const seatingPreference =
            dto.seatingPreference ?? SeatingPreference.ANY;

        const coolingPreference =
            dto.coolingPreference ?? CoolingPreference.ANY;


        try {
            const created = await this.prisma.$transaction(
                async (tx) => {
                    const table = await tx.restaurantTable.findFirst({
                        where: this.buildTableFilter(
                            restaurant.id,
                            dto.guestCount,
                            seatingPreference,
                            coolingPreference,
                            startsAt,
                            endsAt,
                        ),
                        select: {
                            id: true,
                            tableNumber: true,
                            seats: true,
                        },
                        orderBy: { seats: 'asc' },
                    });

                    if (!table) {
                        throw new ConflictException(
                            'No suitable table is available for this time and party size.',
                        );
                    }

                    const reservation = await tx.reservation.create({
                        data: {
                            bookingCode: randomBytes(6)
                                .toString('hex')
                                .toUpperCase(),
                            restaurantId: restaurant.id,
                            guestName: dto.guestName.trim(),
                            guestPhone: dto.guestPhone.trim(),
                            guestEmail: dto.guestEmail?.trim(),
                            startsAt,
                            endsAt,
                            guestCount: dto.guestCount,
                            seatingPreference,
                            coolingPreference,
                            status: ReservationStatus.PENDING,
                            source: ReservationSource.PUBLIC_WEB,
                            specialRequests: dto.specialRequests,
                        },
                    });

                    await tx.reservationTable.create({
                        data: {
                            reservationId: reservation.id,
                            tableId: table.id,
                        },
                    });

                    return {
                        // Internal ID used for notification creation
                        reservationId: reservation.id,

                        // Existing public booking response fields
                        bookingCode: reservation.bookingCode,
                        status: reservation.status,
                        restaurant: restaurant.name,
                        startsAt: reservation.startsAt,
                        endsAt: reservation.endsAt,
                        guestCount: reservation.guestCount,
                        tableNumber: table.tableNumber,
                    };
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                },
            );

            // The transaction has committed successfully.
            // Create the notification separately so it cannot roll back the booking.
            try {
                await this.notificationsService.notifyRestaurantMembersForReservation(
                    created.reservationId,
                    'New reservation',
                    `A new reservation (${created.bookingCode}) has been received.`,
                    'RESERVATION_CREATED',
                );
            } catch (error) {
                this.logger.error(
                    'Failed to create reservation notification',
                    error instanceof Error ? error.stack : String(error),
                );
            }

            // Do not expose the internal reservation ID in the public response.
            const { reservationId, ...bookingResponse } = created;

            return bookingResponse;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                ['P2034', 'P2002'].includes(error.code)
            ) {
                throw new ConflictException(
                    'The booking could not be completed because availability changed. Please check again and retry.',
                );
            }

            throw error;
        }


        // try {
        //     return await this.prisma.$transaction(
        //         async (tx) => {
        //             const table = await tx.restaurantTable.findFirst({
        //                 where: this.buildTableFilter(
        //                     restaurant.id,
        //                     dto.guestCount,
        //                     seatingPreference,
        //                     coolingPreference,
        //                     startsAt,
        //                     endsAt,
        //                 ),
        //                 select: {
        //                     id: true,
        //                     tableNumber: true,
        //                     seats: true,
        //                 },
        //                 orderBy: { seats: 'asc' },
        //             });

        //             if (!table) {
        //                 throw new ConflictException(
        //                     'No suitable table is available for this time and party size.',
        //                 );
        //             }

        //             const reservation = await tx.reservation.create({
        //                 data: {
        //                     bookingCode: randomBytes(6).toString('hex').toUpperCase(),
        //                     restaurantId: restaurant.id,
        //                     guestName: dto.guestName.trim(),
        //                     guestPhone: dto.guestPhone.trim(),
        //                     guestEmail: dto.guestEmail?.trim(),
        //                     startsAt,
        //                     endsAt,
        //                     guestCount: dto.guestCount,
        //                     seatingPreference,
        //                     coolingPreference,
        //                     status: ReservationStatus.PENDING,
        //                     source: ReservationSource.PUBLIC_WEB,
        //                     specialRequests: dto.specialRequests,
        //                 },
        //             });

        //             await tx.reservationTable.create({
        //                 data: {
        //                     reservationId: reservation.id,
        //                     tableId: table.id,
        //                 },
        //             });

        //             return {
        //                 bookingCode: reservation.bookingCode,
        //                 status: reservation.status,
        //                 restaurant: restaurant.name,
        //                 startsAt: reservation.startsAt,
        //                 endsAt: reservation.endsAt,
        //                 guestCount: reservation.guestCount,
        //                 tableNumber: table.tableNumber,
        //             };
        //         },
        //         {
        //             isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        //         },
        //     );
        // } catch (error) {
        //     if (
        //         error instanceof Prisma.PrismaClientKnownRequestError &&
        //         ['P2034', 'P2002'].includes(error.code)
        //     ) {
        //         throw new ConflictException(
        //             'The booking could not be completed because availability changed. Please check again and retry.',
        //         );
        //     }

        //     throw error;
        // }
    }


    async listForRestaurant(
        organizationId: string,
        restaurantId: string,
        query: ListReservationsQueryDto = {},
    ) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: {
                id: restaurantId,
                branch: { organizationId },
            },
            select: { id: true },
        });

        if (!restaurant) {
            throw new NotFoundException(
                'Restaurant not found in this organization.',
            );
        }

        const from = query.from ? new Date(query.from) : undefined;
        const to = query.to ? new Date(query.to) : undefined;

        if (
            (from && Number.isNaN(from.getTime())) ||
            (to && Number.isNaN(to.getTime())) ||
            (from && to && from >= to)
        ) {
            throw new BadRequestException('Provide a valid date range.');
        }

        return this.prisma.reservation.findMany({
            where: {
                restaurantId,
                ...(query.status ? { status: query.status } : {}),
                ...(from || to
                    ? {
                          startsAt: {
                              ...(from ? { gte: from } : {}),
                              ...(to ? { lt: to } : {}),
                          },
                      }
                    : {}),
            },
            include: this.reservationDetailsInclude(),
            orderBy: { startsAt: 'desc' },
            take: from || to ? 500 : 100,
        });
    }

    async getForRestaurant(
        organizationId: string,
        restaurantId: string,
        reservationId: string,
    ) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                restaurantId,
                restaurant: {
                    branch: { organizationId },
                },
            },
            include: {
                ...this.reservationDetailsInclude(),
                events: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!reservation) {
            throw new NotFoundException(
                'Reservation not found in this restaurant.',
            );
        }

        return reservation;
    }

    async changeStatus(
        organizationId: string,
        userId: string,
        restaurantId: string,
        reservationId: string,
        nextStatus: ReservationStatus,
    ) {
        await this.assertReservationAccess(organizationId, userId);

        const reservation = await this.getForRestaurant(
            organizationId,
            restaurantId,
            reservationId,
        );

        const allowedTransitions: Record<
            ReservationStatus,
            ReservationStatus[]
        > = {
            PENDING: [
                ReservationStatus.CONFIRMED,
                ReservationStatus.REJECTED,
                ReservationStatus.CANCELLED,
                ReservationStatus.SEATED,
                ReservationStatus.NO_SHOW,
            ],
            CONFIRMED: [
                ReservationStatus.CANCELLED,
                ReservationStatus.SEATED,
                ReservationStatus.NO_SHOW,
            ],
            SEATED: [
                ReservationStatus.COMPLETED,
                ReservationStatus.CANCELLED,
            ],
            CANCELLED: [],
            REJECTED: [],
            COMPLETED: [],
            NO_SHOW: [],
        };

        if (
            !allowedTransitions[reservation.status].includes(nextStatus)
        ) {
            throw new BadRequestException(
                `Cannot change reservation from ${reservation.status} to ${nextStatus}.`,
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const result = await tx.reservation.updateMany({
                where: {
                    id: reservationId,
                    restaurantId,
                    status: reservation.status,
                    restaurant: {
                        branch: {
                            organizationId,
                        },
                    },
                },
                data: {
                    status: nextStatus,
                },
            });
        
            if (result.count !== 1) {
                throw new ConflictException(
                    'The reservation status has changed. Refresh and try again.',
                );
            }
        
            await tx.reservationEvent.create({
                data: {
                    reservationId,
                    eventType: `STATUS_${nextStatus}`,
                    description:
                        `Status changed from ${reservation.status} to ${nextStatus}`,
                    actorUserId: userId,
                },
            });
        
            return {
                ...reservation,
                status: nextStatus,
            };
        });
    }

    async createWalkIn(
        organizationId: string,
        userId: string,
        restaurantId: string,
        dto: CreateWalkInDto,
    ) {
        await this.assertReservationAccess(organizationId, userId);
        await this.findOrganizationRestaurant(organizationId, restaurantId);

        const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
        const endsAt = dto.endsAt
            ? new Date(dto.endsAt)
            : new Date(startsAt.getTime() + 90 * 60_000);

        this.validateWalkInTime(startsAt, endsAt);

        const created = await this.prisma.$transaction(
            async (tx) => {
                const table = await tx.restaurantTable.findFirst({
                    where: {
                        id: dto.tableId,
                        restaurantId,
                        isActive: true,
                        seats: { gte: dto.guestCount },
                        floor: { isActive: true },
                        room: { isActive: true },
                        reservations: {
                            none: {
                                reservation: {
                                    startsAt: { lt: endsAt },
                                    endsAt: { gt: startsAt },
                                    status: {
                                        in: [
                                            ReservationStatus.PENDING,
                                            ReservationStatus.CONFIRMED,
                                            ReservationStatus.SEATED,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        tableNumber: true,
                    },
                });

                if (!table) {
                    const existing = await tx.restaurantTable.findFirst({
                        where: { id: dto.tableId, restaurantId },
                        select: { id: true, isActive: true, seats: true },
                    });

                    if (!existing) {
                        throw new NotFoundException(
                            'Table not found in this restaurant.',
                        );
                    }

                    if (!existing.isActive || existing.seats < dto.guestCount) {
                        throw new ConflictException(
                            'This table cannot seat this party.',
                        );
                    }

                    throw new ConflictException(
                        'This table is already occupied for that time.',
                    );
                }

                const reservation = await tx.reservation.create({
                    data: {
                        bookingCode: randomBytes(6).toString('hex').toUpperCase(),
                        restaurantId,
                        guestName: dto.guestName.trim(),
                        guestPhone: dto.guestPhone.trim(),
                        startsAt,
                        endsAt,
                        guestCount: dto.guestCount,
                        status: ReservationStatus.SEATED,
                        source: ReservationSource.WALK_IN,
                        specialRequests: dto.specialRequests,
                        createdByUserId: userId,
                    },
                });

                await tx.reservationTable.create({
                    data: {
                        reservationId: reservation.id,
                        tableId: table.id,
                    },
                });

                await tx.reservationEvent.create({
                    data: {
                        reservationId: reservation.id,
                        eventType: 'WALK_IN_SEATED',
                        description: 'Walk-in guest seated',
                        actorUserId: userId,
                    },
                });

                return {
                    id: reservation.id,
                    bookingCode: reservation.bookingCode,
                    status: reservation.status,
                    source: reservation.source,
                    startsAt: reservation.startsAt,
                    endsAt: reservation.endsAt,
                    guestName: reservation.guestName,
                    guestPhone: reservation.guestPhone,
                    guestCount: reservation.guestCount,
                    tableNumber: table.tableNumber,
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        try {
            await this.notificationsService.notifyRestaurantMembersForReservation(
                created.id,
                'Walk-in seated',
                `${created.guestName} was seated at table ${created.tableNumber}.`,
                'WALK_IN_SEATED',
            );
        } catch (error) {
            this.logger.error(
                'Failed to create walk-in notification',
                error instanceof Error ? error.stack : String(error),
            );
        }

        return created;
    }

    async reportForRestaurant(
        organizationId: string,
        restaurantId: string,
        query: ReservationReportQueryDto,
    ) {
        const { from, to, where, rowWhere } = await this.prepareReport(
            organizationId,
            restaurantId,
            query,
        );
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 25;

        const [groups, totalCount, rows] = await Promise.all([
            this.prisma.reservation.groupBy({
                by: ['status'],
                where,
                _count: { _all: true },
            }),
            this.prisma.reservation.count({ where: rowWhere }),
            this.prisma.reservation.findMany({
                where: rowWhere,
                include: this.reservationDetailsInclude(),
                orderBy: { startsAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return {
            from: from.toISOString(),
            to: to.toISOString(),
            page,
            pageSize,
            totalCount,
            totals: this.reportTotals(groups),
            rows: rows.map((row) => this.toReportRow(row)),
        };
    }

    async reportCsv(
        organizationId: string,
        restaurantId: string,
        query: ReservationReportQueryDto,
    ) {
        const { rowWhere } = await this.prepareReport(
            organizationId,
            restaurantId,
            query,
        );
        const rows = await this.prisma.reservation.findMany({
            where: rowWhere,
            include: this.reservationDetailsInclude(),
            orderBy: { startsAt: 'desc' },
            take: 5000,
        });

        const header = [
            'Date and time',
            'Guest name',
            'Phone',
            'Party size',
            'Floor',
            'Room',
            'Table',
            'Status',
            'Staff member',
            'Booking code',
        ];
        const lines = [
            header,
            ...rows.map((row) => {
                const mapped = this.toReportRow(row);
                return [
                    mapped.startsAt,
                    mapped.guestName,
                    mapped.guestPhone,
                    String(mapped.guestCount),
                    mapped.floor?.name ?? '',
                    mapped.room?.name ?? '',
                    mapped.table ? `Table ${mapped.table.tableNumber}` : '',
                    mapped.status,
                    mapped.staff?.name ?? '',
                    mapped.bookingCode,
                ];
            }),
        ];

        return lines
            .map((line) =>
                line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','),
            )
            .join('\n');
    }

    private reservationDetailsInclude() {
        return {
            createdBy: {
                select: { id: true, name: true },
            },
            tables: {
                include: {
                    table: {
                        include: {
                            floor: { select: { id: true, name: true } },
                            room: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        };
    }

    private async assertReservationAccess(
        organizationId: string,
        userId: string,
    ) {
        const membership =
            await this.prisma.organizationMember.findFirst({
                where: {
                    organizationId,
                    userId,
                    isActive: true,
                    organization: { isActive: true },
                },
                select: { role: true },
            });

        if (
            !membership ||
            ![
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
                OrganizationRole.MANAGER,
                OrganizationRole.STAFF,
            ].includes(membership.role)
        ) {
            throw new ForbiddenException(
                'You cannot manage reservations for this organization.',
            );
        }
    }

    private async findOrganizationRestaurant(
        organizationId: string,
        restaurantId: string,
    ) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: {
                id: restaurantId,
                branch: { organizationId },
            },
            select: { id: true },
        });

        if (!restaurant) {
            throw new NotFoundException(
                'Restaurant not found in this organization.',
            );
        }

        return restaurant;
    }

    private validateWalkInTime(startsAt: Date, endsAt: Date) {
        if (
            Number.isNaN(startsAt.getTime()) ||
            Number.isNaN(endsAt.getTime()) ||
            endsAt <= startsAt
        ) {
            throw new BadRequestException(
                'Provide a start time and an end time after the start time.',
            );
        }

        const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;

        if (durationMinutes > 240) {
            throw new BadRequestException(
                'A reservation cannot exceed four hours.',
            );
        }

        const now = Date.now();

        if (startsAt.getTime() < now - 12 * 60 * 60 * 1000) {
            throw new BadRequestException(
                'A walk-in cannot start more than 12 hours ago.',
            );
        }

        if (startsAt.getTime() > now + 15 * 60 * 1000) {
            throw new BadRequestException(
                'A walk-in must start now, not as a future reservation.',
            );
        }
    }

    private async prepareReport(
        organizationId: string,
        restaurantId: string,
        query: ReservationReportQueryDto,
    ) {
        await this.findOrganizationRestaurant(organizationId, restaurantId);
        const from = new Date(query.from);
        const to = new Date(query.to);

        if (
            Number.isNaN(from.getTime()) ||
            Number.isNaN(to.getTime()) ||
            from >= to
        ) {
            throw new BadRequestException(
                'The end of the range must be after the start.',
            );
        }

        if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
            throw new BadRequestException(
                'A report range cannot exceed 366 days.',
            );
        }

        if (query.floorId) {
            const floor = await this.prisma.floor.findFirst({
                where: { id: query.floorId, restaurantId },
                select: { id: true },
            });

            if (!floor) {
                throw new NotFoundException('Floor not found in this restaurant.');
            }
        }

        if (query.roomId) {
            const room = await this.prisma.room.findFirst({
                where: {
                    id: query.roomId,
                    floor: {
                        restaurantId,
                        ...(query.floorId ? { id: query.floorId } : {}),
                    },
                },
                select: { id: true },
            });

            if (!room) {
                throw new NotFoundException('Room not found in this restaurant.');
            }
        }

        if (query.staffUserId) {
            const member = await this.prisma.organizationMember.findFirst({
                where: {
                    organizationId,
                    userId: query.staffUserId,
                },
                select: { id: true },
            });

            if (!member) {
                throw new NotFoundException(
                    'Staff member not found in this organization.',
                );
            }
        }

        const where = this.reportWhere(restaurantId, query, from, to, false);
        const rowWhere = this.reportWhere(restaurantId, query, from, to, true);

        return { from, to, where, rowWhere };
    }

    private reportWhere(
        restaurantId: string,
        query: ReservationReportQueryDto,
        from: Date,
        to: Date,
        includeStatus: boolean,
    ): Prisma.ReservationWhereInput {
        return {
            restaurantId,
            startsAt: { gte: from, lt: to },
            ...(includeStatus && query.status ? { status: query.status } : {}),
            ...(query.staffUserId ? { createdByUserId: query.staffUserId } : {}),
            ...(query.floorId || query.roomId
                ? {
                      tables: {
                          some: {
                              table: {
                                  ...(query.floorId ? { floorId: query.floorId } : {}),
                                  ...(query.roomId ? { roomId: query.roomId } : {}),
                              },
                          },
                      },
                  }
                : {}),
        };
    }

    private reportTotals(
        groups: { status: ReservationStatus; _count: { _all: number } }[],
    ) {
        const count = (status: ReservationStatus) =>
            groups.find((group) => group.status === status)?._count._all ?? 0;

        return {
            total: groups.reduce((sum, group) => sum + group._count._all, 0),
            pending: count(ReservationStatus.PENDING),
            confirmed: count(ReservationStatus.CONFIRMED),
            seated: count(ReservationStatus.SEATED),
            completed: count(ReservationStatus.COMPLETED),
            cancelled: count(ReservationStatus.CANCELLED),
            rejected: count(ReservationStatus.REJECTED),
            noShow: count(ReservationStatus.NO_SHOW),
        };
    }

    private toReportRow(row: {
        id: string;
        bookingCode: string;
        startsAt: Date;
        guestName: string;
        guestPhone: string;
        guestCount: number;
        status: ReservationStatus;
        source: ReservationSource;
        createdBy: { id: string; name: string } | null;
        tables: {
            table: {
                id: string;
                tableNumber: number;
                floor: { id: string; name: string } | null;
                room: { id: string; name: string } | null;
            };
        }[];
    }) {
        const table = row.tables[0]?.table;

        return {
            id: row.id,
            bookingCode: row.bookingCode,
            startsAt: row.startsAt.toISOString(),
            guestName: row.guestName,
            guestPhone: row.guestPhone,
            guestCount: row.guestCount,
            status: row.status,
            source: row.source,
            floor: table?.floor ?? null,
            room: table?.room ?? null,
            table: table
                ? { id: table.id, tableNumber: table.tableNumber }
                : null,
            staff: row.createdBy,
        };
    }


    private getLocalBookingTime(
        date: Date,
        timeZone: string,
    ) {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date);

        const value = (type: string) =>
            parts.find((part) => part.type === type)?.value ?? '';

        const weekdayNumbers: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        };

        const hour = Number(value('hour'));
        const minute = Number(value('minute'));
        const weekday = value('weekday');

        if (
            !Number.isFinite(hour) ||
            !Number.isFinite(minute) ||
            weekdayNumbers[weekday] === undefined
        ) {
            throw new BadRequestException(
                'Could not determine the restaurant local time.',
            );
        }

        return {
            dateKey: `${value('year')}-${value('month')}-${value('day')}`,
            dayOfWeek: weekdayNumbers[weekday],
            minutes: hour * 60 + minute,
        };
    }

    private timeStringToMinutes(value: string): number {
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

        if (!match) {
            throw new BadRequestException(
                'Restaurant opening hours contain an invalid time.',
            );
        }

        return Number(match[1]) * 60 + Number(match[2]);
    }


    private async assertWithinOpeningHours(
        restaurantId: string,
        timeZone: string,
        startsAt: Date,
        endsAt: Date,
    ): Promise<void> {
        let startLocal: ReturnType<
            ReservationsService['getLocalBookingTime']
        >;
        let endLocal: ReturnType<
            ReservationsService['getLocalBookingTime']
        >;

        try {
            startLocal = this.getLocalBookingTime(startsAt, timeZone);
            endLocal = this.getLocalBookingTime(endsAt, timeZone);
        } catch {
            throw new BadRequestException(
                'The restaurant timezone or reservation time is invalid.',
            );
        }

        // This version supports bookings within one local calendar day.
        if (startLocal.dateKey !== endLocal.dateKey) {
            throw new BadRequestException(
                'Reservations crossing local midnight are not supported yet.',
            );
        }

        const openingHour = await this.prisma.openingHour.findUnique({
            where: {
                restaurantId_dayOfWeek: {
                    restaurantId,
                    dayOfWeek: startLocal.dayOfWeek,
                },
            },
        });

        if (!openingHour || openingHour.isClosed) {
            throw new BadRequestException(
                'The restaurant is closed on the selected day.',
            );
        }

        if (!openingHour.openTime || !openingHour.closeTime) {
            throw new BadRequestException(
                'Restaurant opening hours are incomplete for the selected day.',
            );
        }

        const openingMinutes = this.timeStringToMinutes(
            openingHour.openTime,
        );
        const closingMinutes = this.timeStringToMinutes(
            openingHour.closeTime,
        );

        if (
            startLocal.minutes < openingMinutes ||
            endLocal.minutes > closingMinutes
        ) {
            throw new BadRequestException(
                `Bookings must be within the restaurant opening hours: ${openingHour.openTime}–${openingHour.closeTime}.`,
            );
        }
    }


    private normalizePhone(phone: string): string {
        return phone.replace(/\D/g, '');
    }

    private async findCustomerReservation(
        bookingCode: string,
        guestPhone: string,
    ) {
        const reservation = await this.prisma.reservation.findUnique({
            where: {
                bookingCode: bookingCode.trim().toUpperCase(),
            },
            include: {
                restaurant: {
                    select: {
                        name: true,
                        phone: true,
                        addressLine1: true,
                        city: true,
                        state: true,
                    },
                },
                tables: {
                    include: {
                        table: {
                            select: {
                                tableNumber: true,
                                seats: true,
                            },
                        },
                    },
                },
            },
        });

        // Return the same error for an unknown code and a phone mismatch.
        if (
            !reservation ||
            this.normalizePhone(reservation.guestPhone) !==
            this.normalizePhone(guestPhone)
        ) {
            throw new NotFoundException(
                'Booking not found. Check your booking code and phone number.',
            );
        }

        return reservation;
    }

    async lookupCustomerReservation(dto: LookupReservationDto) {
        const reservation = await this.findCustomerReservation(
            dto.bookingCode,
            dto.guestPhone,
        );

        return {
            bookingCode: reservation.bookingCode,
            status: reservation.status,
            restaurant: reservation.restaurant,
            startsAt: reservation.startsAt,
            endsAt: reservation.endsAt,
            guestName: reservation.guestName,
            guestCount: reservation.guestCount,
            seatingPreference: reservation.seatingPreference,
            coolingPreference: reservation.coolingPreference,
            specialRequests: reservation.specialRequests,
            tables: reservation.tables.map((item) => item.table),
        };
    }

    async cancelCustomerReservation(dto: CancelReservationDto) {
        const reservation = await this.findCustomerReservation(
            dto.bookingCode,
            dto.guestPhone,
        );

        const canCancel =
            reservation.status === ReservationStatus.PENDING ||
            reservation.status === ReservationStatus.CONFIRMED;

        if (!canCancel) {
            throw new ConflictException(
                `A reservation with status ${reservation.status} cannot be cancelled through this endpoint.`,
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // Conditional update prevents cancellation after another
            // request has already changed the reservation status.
            const result = await tx.reservation.updateMany({
                where: {
                    id: reservation.id,
                    status: {
                        in: [
                            ReservationStatus.PENDING,
                            ReservationStatus.CONFIRMED,
                        ],
                    },
                },
                data: {
                    status: ReservationStatus.CANCELLED,
                },
            });

            if (result.count !== 1) {
                throw new ConflictException(
                    'The reservation status has changed. Look up the booking again.',
                );
            }

            await tx.reservationEvent.create({
                data: {
                    reservationId: reservation.id,
                    eventType: 'STATUS_CANCELLED',
                    description: 'Cancelled through customer booking lookup',
                },
            });

            return {
                bookingCode: reservation.bookingCode,
                status: ReservationStatus.CANCELLED,
                message: 'Reservation cancelled successfully.',
            };
        });
    }


}