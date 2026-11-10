import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';
import { OpeningHoursController } from './opening-hours.controller.js';
import { OpeningHoursService } from './opening-hours.service.js';
import { PublicRestaurantsController } from './public-restaurants.controller.js';
import { PublicRestaurantsService } from './public-restaurants.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EntitlementsModule,
  ],
  controllers: [
    RestaurantsController,
    OpeningHoursController,
    PublicRestaurantsController,
  ],
  providers: [
    RestaurantsService,
    OpeningHoursService,
    OrganizationMemberGuard,
    OrganizationRoleGuard,
    PublicRestaurantsService,
  ],
})
export class RestaurantsModule {}