import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  Controller,
  Get,
  INestApplication,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OrganizationRole } from '@prisma/client';
import request from 'supertest';

import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy.js';
import { OrganizationMemberGuard } from '../src/auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../src/auth/guards/organization-role.guard.js';
import { RequireOrganizationRoles } from '../src/auth/decorators/organization-roles.decorator.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const TEST_SECRET = 'test-only-secret-for-jwt-e2e-tests-not-production';

@Controller('organizations/:organizationId/test-resource')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
class TestOrganizationController {
  @Get()
  getResource(@Param('organizationId') organizationId: string) {
    return { organizationId };
  }

  @Get('manage')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  )
  manageResource(@Param('organizationId') organizationId: string) {
    return { organizationId, managed: true };
  }
}

describe('Organization authorization HTTP (real JWT e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
    },
  };

  const activeUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    status: 'ACTIVE',
  };

  async function createToken(
    payload: Record<string, unknown> = {
      sub: 'user-1',
      email: 'user@example.com',
    },
  ) {
    return jwtService.signAsync(payload);
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock.user.findUnique.mockResolvedValue(activeUser);
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      organizationId: 'org-1',
      role: OrganizationRole.STAFF,
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [TestOrganizationController],
      providers: [
        JwtStrategy,
        OrganizationMemberGuard,
        OrganizationRoleGuard,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'JWT_ACCESS_SECRET') {
                return TEST_SECRET;
              }

              throw new Error(`Unexpected configuration key: ${key}`);
            },
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    jwtService = moduleFixture.get(JwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should reject a request without a bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .expect(401);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.organizationMember.findFirst).not.toHaveBeenCalled();
  });

  it('should reject a malformed token', async () => {
    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject an expired signed token', async () => {
    const token = await jwtService.signAsync(
      {
        sub: 'user-1',
        email: 'user@example.com',
      },
      {
        expiresIn: -60,
      },
    );

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject a token without a subject', async () => {
    const token = await createToken({
      email: 'user@example.com',
    });

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject a missing or inactive database user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...activeUser,
      status: 'SUSPENDED',
    });

    const token = await createToken();

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    expect(prismaMock.organizationMember.findFirst).not.toHaveBeenCalled();
  });

  it('should reject an authenticated user without active membership', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(null);

    const token = await createToken();

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(prismaMock.organizationMember.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        organizationId: 'org-1',
        isActive: true,
        organization: { isActive: true },
      },
      select: {
        organizationId: true,
        role: true,
      },
    });
  });

  it('should allow an active member to access the resource', async () => {
    const token = await createToken();

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ organizationId: 'org-1' });
      });
  });

  it('should deny staff access to owner/admin-only actions', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      organizationId: 'org-1',
      role: OrganizationRole.STAFF,
    });

    const token = await createToken();

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource/manage')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow an owner to perform owner/admin-only actions', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue({
      organizationId: 'org-1',
      role: OrganizationRole.OWNER,
    });

    const token = await createToken();

    await request(app.getHttpServer())
      .get('/api/organizations/org-1/test-resource/manage')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          organizationId: 'org-1',
          managed: true,
        });
      });
  });
});

