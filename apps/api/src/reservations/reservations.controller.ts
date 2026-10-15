import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
  } from '@nestjs/common';
  import { Type } from 'class-transformer';
  import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
  } from 'class-validator';
  import {
    CoolingPreference,
    SeatingPreference,
  } from '@prisma/client';
  import { ReservationsService } from './reservations.service.js';
  import { CreateReservationDto } from './dto/create-reservation.dto.js';
  
  class AvailabilityQueryDto {
    @IsDateString()
    startsAt!: string;
  
    @IsDateString()
    endsAt!: string;
  
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(30)
    guestCount!: number;
  
    @IsOptional()
    @IsEnum(SeatingPreference)
    seatingPreference?: SeatingPreference;
  
    @IsOptional()
    @IsEnum(CoolingPreference)
    coolingPreference?: CoolingPreference;
  }
  
  @Controller('public/restaurants/:slug')
  export class ReservationsController {
    constructor(
      private readonly reservationsService: ReservationsService,
    ) {}
  
    @Get('availability')
    availability(
      @Param('slug') slug: string,
      @Query() query: AvailabilityQueryDto,
    ) {
      return this.reservationsService.availability(
        slug,
        query.startsAt,
        query.endsAt,
        query.guestCount,
        query.seatingPreference,
        query.coolingPreference,
      );
    }
  
    @Post('reservations')
    create(
      @Param('slug') slug: string,
      @Body() dto: CreateReservationDto,
    ) {
      return this.reservationsService.createPublicReservation(
        slug,
        dto,
      );
    }
  }