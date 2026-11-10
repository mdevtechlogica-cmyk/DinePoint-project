import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePlatformRoles } from '../auth/decorators/platform-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { ReplaceEntitlementsDto } from './dto/replace-entitlements.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlansService } from './plans.service.js';

@Controller('platform/plans')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list() {
    return this.plans.list();
  }

  @Post()
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlanDto) {
    return this.plans.create(user.id, dto);
  }

  @Patch(':planId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  update(
    @Param('planId') planId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plans.update(planId, user.id, dto);
  }

  @Put(':planId/entitlements')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  replaceEntitlements(
    @Param('planId') planId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceEntitlementsDto,
  ) {
    return this.plans.replaceEntitlements(planId, user.id, dto);
  }
}
