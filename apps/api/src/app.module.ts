import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';
import { TablesModule } from './tables/tables.module.js';
import { FloorsModule } from './floors/floors.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { DeviceTokensModule } from './device-tokens/device-tokens.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { MailModule } from './mail/mail.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    MailModule,
    AuthModule,
    RestaurantsModule,
    OrganizationsModule,
    TablesModule,
    FloorsModule,
    EmployeesModule,
    ReservationsModule,
    NotificationsModule,
    DeviceTokensModule,
    ApiKeysModule,
    IntegrationsModule,
    McpModule,
    PlatformModule,
    MessagingModule,
  ],

  controllers: [AppController, HealthController],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
