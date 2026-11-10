import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWalkInDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  guestName!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  guestPhone!: string;

  @IsInt()
  @Min(1)
  @Max(30)
  guestCount!: number;

  @IsString()
  tableId!: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;
}
