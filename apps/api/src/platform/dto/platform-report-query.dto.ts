import { IsDateString } from 'class-validator';

export class PlatformReportQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
