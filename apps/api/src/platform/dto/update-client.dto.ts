import { IsBoolean } from 'class-validator';

export class UpdateClientDto {
  @IsBoolean()
  isActive!: boolean;
}
