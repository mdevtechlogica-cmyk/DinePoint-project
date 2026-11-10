import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlatformReportsService } from './platform-reports.service.js';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: PlatformReportsService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
      },
    });

    return record;
  }

  @Get('overview')
  overview() {
    return this.reports.overview();
  }
}
