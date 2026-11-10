import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePlatformRoles } from '../auth/decorators/platform-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { InvoicesService } from './invoices.service.js';

@Controller('platform/invoices')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@Query() query: ListInvoicesQueryDto) {
    return this.invoices.list(query);
  }

  @Post()
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.id, dto);
  }

  @Patch(':invoiceId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN)
  update(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(invoiceId, user.id, dto);
  }
}
