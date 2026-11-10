import { Module } from '@nestjs/common';
import { DeviceTokensModule } from '../device-tokens/device-tokens.module.js';
import { FcmService } from './fcm.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [DeviceTokensModule],
  controllers: [NotificationsController],
  providers: [FcmService, NotificationsService],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
