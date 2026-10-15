
import {
    Controller,
    Get,
    Param,
    Patch,
    Body,
    UseGuards,
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  
  import { ReservationsService } from './reservations.service.js';
  import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto.js';
  
  @Controller(
    'organizations/:organizationId/restaurants/:restaurantId/reservations',
  )
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class RestaurantReservationsController {
    constructor(
      private readonly reservationsService: ReservationsService,
    ) {}
  
    @Get()
    list(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
    ) {
      return this.reservationsService.listForRestaurant(
        organizationId,
        restaurantId,
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
  