import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';

@Module({
  imports: [PrismaModule, AuthModule, EntitlementsModule],
  controllers: [TablesController],
  providers: [TablesService, OrganizationMemberGuard],
})
export class TablesModule {}