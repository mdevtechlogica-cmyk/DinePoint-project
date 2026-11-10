import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import { FloorsController } from './floors.controller.js';
import { FloorsService } from './floors.service.js';

@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [FloorsController],
  providers: [FloorsService, OrganizationMemberGuard, OrganizationRoleGuard],
})
export class FloorsModule {}
