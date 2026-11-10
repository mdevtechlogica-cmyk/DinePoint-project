import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EntitlementsService } from '../entitlements/entitlements.service.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class OrganizationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  @Get(':organizationId')
  async findOne(@Param('organizationId') organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        branches: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });
  }

  @Get(':organizationId/entitlements')
  async entitlementsForOrg(@Param('organizationId') organizationId: string) {
    const [entitlements, usage] = await Promise.all([
      this.entitlements.resolve(organizationId),
      this.entitlements.getUsage(organizationId),
    ]);

    return {
      ...entitlements,
      usage,
    };
  }
}
