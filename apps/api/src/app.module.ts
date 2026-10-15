import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';
import { TablesModule } from './tables/tables.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    OrganizationsModule,
    TablesModule,
    ReservationsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}