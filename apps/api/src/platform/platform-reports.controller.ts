import { Controller, Get, Header, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import { PlatformReportQueryDto } from './dto/platform-report-query.dto.js';
import { PlatformReportsService } from './platform-reports.service.js';

@Controller('platform/reports')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformReportsController {
  constructor(private readonly reports: PlatformReportsService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="platform-report.csv"')
  async exportCsv(@Query() query: PlatformReportQueryDto) {
    const csv = await this.reports.reportCsv(query);
    return new StreamableFile(Buffer.from(csv));
  }

  @Get()
  report(@Query() query: PlatformReportQueryDto) {
    return this.reports.report(query);
  }
}
