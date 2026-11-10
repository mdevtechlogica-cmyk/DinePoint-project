import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export function pageWindow(page?: number, pageSize?: number) {
  const current = page ?? 1;
  const size = pageSize ?? 25;
  return { page: current, pageSize: size, skip: (current - 1) * size };
}
