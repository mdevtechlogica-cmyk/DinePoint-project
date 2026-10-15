import { Module } from '@nestjs/common';

import { OrganizationsController } from './organizations.controller.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationMemberGuard],
})
export class OrganizationsModule {}