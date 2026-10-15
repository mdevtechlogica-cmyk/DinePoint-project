
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LookupReservationDto {
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  bookingCode!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  guestPhone!: string;
}
