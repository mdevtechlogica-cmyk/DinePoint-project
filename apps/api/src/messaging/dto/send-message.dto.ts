import { MessageChannel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsEnum(MessageChannel)
  channel!: MessageChannel;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;

  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;
}
