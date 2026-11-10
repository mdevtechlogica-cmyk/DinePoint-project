import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PlatformRoleGuard } from '../auth/guards/platform-role.guard.js';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';
import { PlatformAuditService } from './platform-audit.service.js';
import { PlatformController } from './platform.controller.js';
import { PlatformReportsController } from './platform-reports.controller.js';
import { PlatformReportsService } from './platform-reports.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    PlatformController,
    PlatformReportsController,
    ClientsController,
    PlansController,
    SubscriptionsController,
    InvoicesController,
  ],
  providers: [
    PlatformRoleGuard,
    PlatformAuditService,
    PlatformReportsService,
    ClientsService,
    PlansService,
    SubscriptionsService,
    InvoicesService,
  ],
})
export class PlatformModule {}
