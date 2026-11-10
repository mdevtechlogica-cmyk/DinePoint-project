
import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IntegrationsController } from './integrations.controller.js';

@Module({
  imports: [PrismaModule, ApiKeysModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
