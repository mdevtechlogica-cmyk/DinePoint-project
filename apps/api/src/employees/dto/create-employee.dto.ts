import { OrganizationRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  phone!: string;

  @IsEnum(OrganizationRole)
  role!: OrganizationRole;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
