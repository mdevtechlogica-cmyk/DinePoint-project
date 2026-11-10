import { OrganizationRole } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListEmployeesQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';

  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
