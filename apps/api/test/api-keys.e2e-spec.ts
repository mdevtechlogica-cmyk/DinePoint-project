
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    Controller,
    Get,
    INestApplication,
    Param,
    Post,
    Delete,
    Body,
    Req,
    UseGuards,
    UnauthorizedException,
  } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ApiKeysController } from '../src/api-keys/api-keys.controller.js';
import { ApiKeysService } from '../src/api-keys/api-keys.service.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../src/auth/guards/organization-member.guard.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API-key management authorization (HTTP e2e)', () => {
    let app: INestApplication;

    const serviceMock = {
        create: vi.fn(),
        list: vi.fn(),
        revoke: vi.fn(),
    };

    const prismaMock = {
        organizationMember: {
            findFirst: vi.fn(),
        },
    };

    let currentRole = 'OWNER';
    let currentOrganizationId = 'org-1';

    beforeEach(async () => {
        vi.clearAllMocks();
        currentRole = 'OWNER';
        currentOrganizationId = 'org-1';

        prismaMock.organizationMember.findFirst.mockImplementation(
            async ({ where }: any) => {
                if (
                    where.organizationId !== currentOrganizationId ||
                    where.userId !== 'user-1'
                ) {
                    return null;
                }

                return {
                    organizationId: currentOrganizationId,
                    role: currentRole,
                };
            },
        );

        serviceMock.create.mockResolvedValue({
            id: 'key-1',
            name: 'Test connector',
            keyPrefix: 'dp_live_test',
            scopes: ['restaurants:read'],
            apiKey: `dp_live_${'a'.repeat(43)}`,
            warning: 'Copy this key now. It cannot be retrieved again.',
        });

        serviceMock.list.mockResolvedValue([
            { id: 'key-1', name: 'Test connector', keyPrefix: 'dp_live_test' },
        ]);

        serviceMock.revoke.mockResolvedValue({ success: true });

        const builder = Test.createTestingModule({
            controllers: [ApiKeysController],
            providers: [
                OrganizationMemberGuard,
                {
                    provide: ApiKeysService,
                    useValue: serviceMock,
                },
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        });

        builder.overrideGuard(JwtAuthGuard).useValue({
            canActivate: (context: any) => {
                const req = context.switchToHttp().getRequest();

                if (req.headers.authorization !== 'Bearer test-jwt') {
                    const { UnauthorizedException } = require('@nestjs/common');
                    throw new UnauthorizedException();
                }

                req.user = {
                    id: 'user-1',
                    email: 'user@example.com',
                    name: 'Test User',
                };

                return true;
            },
        });

        const moduleFixture = await builder.compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('rejects requests without a JWT', async () => {
        await request(app.getHttpServer())
            .get('/api/organizations/org-1/api-keys')
            .expect(401);

        expect(serviceMock.list).not.toHaveBeenCalled();
    });

    it('rejects STAFF members from listing keys', async () => {
        currentRole = 'STAFF';

        await request(app.getHttpServer())
            .get('/api/organizations/org-1/api-keys')
            .set('Authorization', 'Bearer test-jwt')
            .expect(403);

        expect(serviceMock.list).not.toHaveBeenCalled();
    });

    it('allows an OWNER to list keys for their organization', async () => {
        await request(app.getHttpServer())
            .get('/api/organizations/org-1/api-keys')
            .set('Authorization', 'Bearer test-jwt')
            .expect(200)
            .expect(({ body }) => {
                expect(body).toHaveLength(1);
                expect(body[0].id).toBe('key-1');
            });

        expect(serviceMock.list).toHaveBeenCalledWith('org-1');
    });

    it('rejects a different organization in the URL when membership is absent', async () => {
        await request(app.getHttpServer())
          .get('/api/organizations/org-other/api-keys')
          .set('Authorization', 'Bearer test-jwt')
          .expect(403);
      
        expect(serviceMock.list).not.toHaveBeenCalled();
      });

    it('allows an ADMIN to create a key and returns the one-time key', async () => {
        currentRole = 'ADMIN';

        await request(app.getHttpServer())
            .post('/api/organizations/org-1/api-keys')
            .set('Authorization', 'Bearer test-jwt')
            .send({
                name: 'Test connector',
                scopes: ['restaurants:read'],
            })
            .expect(201)
            .expect(({ body }) => {
                expect(body.apiKey).toMatch(/^dp_live_/);
            });

        expect(serviceMock.create).toHaveBeenCalledWith(
            'org-1',
            'user-1',
            expect.objectContaining({
                name: 'Test connector',
                scopes: ['restaurants:read'],
            }),
        );
    });

    it('rejects STAFF members from revoking keys', async () => {
        currentRole = 'STAFF';

        await request(app.getHttpServer())
            .delete('/api/organizations/org-1/api-keys/key-1')
            .set('Authorization', 'Bearer test-jwt')
            .expect(403);

        expect(serviceMock.revoke).not.toHaveBeenCalled();
    });

    it('allows an OWNER to revoke a key within their organization', async () => {
        await request(app.getHttpServer())
            .delete('/api/organizations/org-1/api-keys/key-1')
            .set('Authorization', 'Bearer test-jwt')
            .expect(200)
            .expect(({ body }) => {
                expect(body).toEqual({ success: true });
            });

        expect(serviceMock.revoke).toHaveBeenCalledWith('org-1', 'key-1');
    });
});
