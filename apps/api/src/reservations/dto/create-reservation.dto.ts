import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
  } from 'class-validator';
  import {
    CoolingPreference,
    SeatingPreference,
  } from '@prisma/client';
  
  export class CreateReservationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    guestName!: string;
  
    @IsString()
    @MinLength(7)
    @MaxLength(20)
    guestPhone!: string;
  
    @IsOptional()
    @IsEmail()
    guestEmail?: string;
  
    @IsDateString()
    startsAt!: string;
  
    @IsDateString()
    endsAt!: string;
  
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
  
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    specialRequests?: string;
  }