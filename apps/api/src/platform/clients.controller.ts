import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePlatformRoles } from '../auth/decorators/platform-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ClientsService } from './clients.service.js';
import { ListClientsQueryDto } from './dto/list-clients-query.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@Controller('platform/clients')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query() query: ListClientsQueryDto) {
    return this.clients.list(query);
  }

  @Get(':organizationId')
  getOne(@Param('organizationId') organizationId: string) {
    return this.clients.getOne(organizationId);
  }

  @Patch(':organizationId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  update(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(organizationId, user.id, dto);
  }
}
