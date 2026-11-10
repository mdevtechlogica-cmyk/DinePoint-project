import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';

@Module({
  imports: [AuthModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, OrganizationMemberGuard, OrganizationRoleGuard],
})
export class EmployeesModule {}
