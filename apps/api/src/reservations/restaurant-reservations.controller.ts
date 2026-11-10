
import {
    Controller,
    Get,
    Header,
    Param,
    Patch,
    Post,
    Body,
    Query,
    StreamableFile,
    UseGuards,
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  
import { ReservationsService } from './reservations.service.js';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto.js';
import { ListReservationsQueryDto } from './dto/list-reservations-query.dto.js';
import { ReservationReportQueryDto } from './dto/reservation-report-query.dto.js';
import { CreateWalkInDto } from './dto/create-walk-in.dto.js';
  
  @Controller(
    'organizations/:organizationId/restaurants/:restaurantId/reservations',
  )
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class RestaurantReservationsController {
    constructor(
      private readonly reservationsService: ReservationsService,
    ) {}
  
    @Get('report/export')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="booking-report.csv"')
    async exportReport(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Query() query: ReservationReportQueryDto,
    ) {
      const csv = await this.reservationsService.reportCsv(
        organizationId,
        restaurantId,
        query,
      );

      return new StreamableFile(Buffer.from(csv));
    }

    @Get('report')
    report(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Query() query: ReservationReportQueryDto,
    ) {
      return this.reservationsService.reportForRestaurant(
        organizationId,
        restaurantId,
        query,
      );
    }

    @Get()
    list(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Query() query: ListReservationsQueryDto,
    ) {
      return this.reservationsService.listForRestaurant(
        organizationId,
        restaurantId,
        query,
      );
    }

    @Post()
    createWalkIn(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: CreateWalkInDto,
    ) {
      return this.reservationsService.createWalkIn(
        organizationId,
        user.id,
        restaurantId,
        dto,
      );
    }
  
    @Get(':reservationId')
    getOne(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Param('reservationId') reservationId: string,
    ) {
      return this.reservationsService.getForRestaurant(
        organizationId,
        restaurantId,
        reservationId,
      );
    }
  
    @Patch(':reservationId/status')
    updateStatus(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Param('reservationId') reservationId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: UpdateReservationStatusDto,
    ) {
      return this.reservationsService.changeStatus(
        organizationId,
        user.id,
        restaurantId,
        reservationId,
        dto.status,
      );
    }
  }
  