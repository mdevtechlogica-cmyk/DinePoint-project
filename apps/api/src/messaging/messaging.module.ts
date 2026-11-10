import { Module } from '@nestjs/common';

import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { MessageProviderService } from './message-provider.service.js';

@Module({
  imports: [EntitlementsModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessageProviderService],
  exports: [MessagingService],
})
export class MessagingModule {}
