
import {
    IsBoolean,
    IsInt,
    IsOptional,
    Matches,
    Max,
    Min,
  } from 'class-validator';
  
  export class UpsertOpeningHourDto {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek!: number;
  
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    openTime?: string;
  
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    closeTime?: string;
  
    @IsOptional()
    @IsBoolean()
    isClosed?: boolean;
  }
  