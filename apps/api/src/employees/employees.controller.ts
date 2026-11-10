import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequireOrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';

@Controller('organizations/:organizationId/employees')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  list(
    @Param('organizationId') organizationId: string,
    @Query() query: ListEmployeesQueryDto,
  ) {
    return this.employeesService.list(organizationId, query);
  }

  @Post()
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  create(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(organizationId, user.id, dto);
  }

  @Patch(':memberId')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  update(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(organizationId, user.id, memberId, dto);
  }
}
