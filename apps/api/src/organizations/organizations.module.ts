import { Module } from '@nestjs/common';

import { OrganizationsController } from './organizations.controller.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';

@Module({
  imports: [EntitlementsModule],
  controllers: [OrganizationsController],
  providers: [OrganizationMemberGuard],
})
export class OrganizationsModule {}
