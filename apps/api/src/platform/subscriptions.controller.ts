import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePlatformRoles } from '../auth/decorators/platform-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('subscriptions')
  list(@Query() query: ListSubscriptionsQueryDto) {
    return this.subscriptions.list(query);
  }

  @Get('subscriptions/:subscriptionId/events')
  events(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.events(subscriptionId);
  }

  @Post('clients/:organizationId/subscription')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  assign(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptions.assign(organizationId, user.id, dto);
  }

  @Patch('subscriptions/:subscriptionId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  update(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptions.update(subscriptionId, user.id, dto);
  }
}
