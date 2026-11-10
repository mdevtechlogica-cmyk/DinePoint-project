import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import { RequireOrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { MessagingService } from './messaging.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('organizations/:organizationId/messages')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post()
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
    OrganizationRole.STAFF,
  )
  send(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messaging.send(organizationId, user.id, dto);
  }
}
