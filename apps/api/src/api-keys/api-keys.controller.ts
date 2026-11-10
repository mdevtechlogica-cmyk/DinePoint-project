
import {
    Body,
    Controller,
    Delete,
    Get,
    ForbiddenException,
    Param,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { Throttle } from '@nestjs/throttler';
  import type { Request } from 'express';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
  import { ApiKeysService } from './api-keys.service.js';
  
  type OrganizationRequest = Request & {
    user?: AuthenticatedUser;
    organizationMembership?: {
      organizationId: string;
      role: string;
    };
  };
  
  @Controller('organizations/:organizationId/api-keys')
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) {}
  
    private requireKeyManager(request: OrganizationRequest): {
      userId: string;
      organizationId: string;
    } {
      const membership = request.organizationMembership;
      const user = request.user;
  
      if (!user || !membership) {
        throw new ForbiddenException('Active organization membership required');
      }
  
      if (!['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new ForbiddenException(
          'Only organization owners and admins can manage API keys',
        );
      }
  
      return {
        userId: user.id,
        organizationId: membership.organizationId,
      };
    }
  
    @Post()
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    async create(
      @Param('organizationId') _organizationId: string,
      @Body() dto: CreateApiKeyDto,
      @Req() request: OrganizationRequest,
    ) {
      const access = this.requireKeyManager(request);
  
      return this.apiKeysService.create(
        access.organizationId,
        access.userId,
        dto,
      );
    }
  
    @Get()
    async list(
      @Param('organizationId') _organizationId: string,
      @Req() request: OrganizationRequest,
    ) {
      const access = this.requireKeyManager(request);
      return this.apiKeysService.list(access.organizationId);
    }
  
    @Delete(':keyId')
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    async revoke(
      @Param('organizationId') _organizationId: string,
      @Param('keyId') keyId: string,
      @Req() request: OrganizationRequest,
    ) {
      const access = this.requireKeyManager(request);
      return this.apiKeysService.revoke(access.organizationId, keyId);
    }
  }
  