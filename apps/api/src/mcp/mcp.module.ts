import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { McpController } from './mcp.controller.js';

@Module({
  imports: [ApiKeysModule, PrismaModule],
  controllers: [McpController],
})
export class McpModule {}