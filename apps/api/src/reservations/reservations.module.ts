
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

import { ReservationsController } from './reservations.controller.js';
import { RestaurantReservationsController } from './restaurant-reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { CustomerReservationsController } from './customer-reservations.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [
    ReservationsController,
    RestaurantReservationsController,
    CustomerReservationsController,
  ],
  providers: [
    ReservationsService,
    OrganizationMemberGuard,
  ],
})
export class ReservationsModule {}
