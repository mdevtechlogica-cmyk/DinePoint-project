import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ApiKeysService } from '../api-keys.service.js';

export const API_KEY_SCOPES_KEY = 'api_key_required_scopes';

export const RequireApiKeyScopes = (...scopes: string[]) =>
    SetMetadata(API_KEY_SCOPES_KEY, scopes);

type ApiKeyRequest = Request & {
    apiKey?: {
        id: string;
        organizationId: string;
        scopes: string[];
    };
};

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    constructor(
        private readonly apiKeysService: ApiKeysService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<ApiKeyRequest>();
        const authorization = request.headers.authorization;
        const match =
            typeof authorization === 'string'
                ? /^Bearer\s+(dp_live_[A-Za-z0-9_-]+)$/i.exec(authorization.trim())
                : null;

        if (!match) {
            throw new UnauthorizedException('API key required');
        }

        const rawKey = match[1];
        const apiKey = await this.apiKeysService.authenticate(rawKey);

        if (!apiKey) {
            throw new UnauthorizedException('Invalid or expired API key');
        }

        const requiredScopes =
            this.reflector.getAllAndOverride<string[]>(API_KEY_SCOPES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];

        if (!requiredScopes.every((scope) => apiKey.scopes.includes(scope))) {
            throw new ForbiddenException('API key does not have the required scope');
        }

        request.apiKey = apiKey;
        return true;
    }
}
