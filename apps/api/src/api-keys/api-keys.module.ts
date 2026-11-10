
import { Module } from '@nestjs/common';

import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js';

@Module({
  controllers: [ApiKeysController],
  providers: [
    ApiKeysService,
    ApiKeyAuthGuard,
    OrganizationMemberGuard,
  ],
  exports: [ApiKeysService, ApiKeyAuthGuard],
})
export class ApiKeysModule {}
