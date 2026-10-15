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

        return this.prisma.reservation.findMany({
            where: { restaurantId },
            include: {
                tables: {
                    include: {
                        table: true,
                    },
                },
            },
            orderBy: { startsAt: 'desc' },
            take: 100,
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
                tables: {
                    include: {
                        table: true,
                    },
                },
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
            ],
            CONFIRMED: [
                ReservationStatus.CANCELLED,
                ReservationStatus.SEATED,
                ReservationStatus.NO_SHOW,
            ],
            SEATED: [ReservationStatus.COMPLETED],
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
            const updated = await tx.reservation.update({
                where: { id: reservationId },
                data: { status: nextStatus },
            });

            await tx.reservationEvent.create({
                data: {
                    reservationId,
                    eventType: `STATUS_${nextStatus}`,
                    description:
                        `Status changed from ${reservation.status} to ${nextStatus}`,
                    actorUserId: userId,
                },
            });

            return updated;
        });
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