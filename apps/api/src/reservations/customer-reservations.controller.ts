import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ReservationsService } from './reservations.service.js';
import { LookupReservationDto } from './dto/lookup-reservation.dto.js';
import { CancelReservationDto } from './dto/cancel-reservation.dto.js';

@Controller('public/reservations')
export class CustomerReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post('lookup')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  lookup(@Body() dto: LookupReservationDto) {
    return this.reservationsService.lookupCustomerReservation(dto);
  }

  @Post('cancel')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  cancel(@Body() dto: CancelReservationDto) {
    return this.reservationsService.cancelCustomerReservation(dto);
  }
}
