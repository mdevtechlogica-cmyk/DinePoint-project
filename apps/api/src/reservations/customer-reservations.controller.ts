
import {
    Body,
    Controller,
    Post,
  } from '@nestjs/common';
  
  import { ReservationsService } from './reservations.service.js';
  import { LookupReservationDto } from './dto/lookup-reservation.dto.js';
  import { CancelReservationDto } from './dto/cancel-reservation.dto.js';
  
  @Controller('public/reservations')
  export class CustomerReservationsController {
    constructor(
      private readonly reservationsService: ReservationsService,
    ) {}
  
    @Post('lookup')
    lookup(@Body() dto: LookupReservationDto) {
      return this.reservationsService.lookupCustomerReservation(dto);
    }
  
    @Post('cancel')
    cancel(@Body() dto: CancelReservationDto) {
      return this.reservationsService.cancelCustomerReservation(dto);
    }
  }
  