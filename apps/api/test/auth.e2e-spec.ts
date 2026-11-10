import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const TEST_SECRET = 'test-only-secret-for-auth-e2e-not-production';

describe('Authentication HTTP (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const authServiceMock = {
    register: vi.fn(),
    login: vi.fn(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const activeUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    authServiceMock.register.mockResolvedValue({
      message: 'Account registered successfully',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'user@example.com',
      },
      organization: {
        id: 'org-1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
      },
      accessToken: 'test-access-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
    });

    authServiceMock.login.mockResolvedValue({
      message: 'Login successful',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'user@example.com',
      },
      memberships: [],
      accessToken: 'test-access-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
    });

    prismaMock.user.findUnique.mockResolvedValue(activeUser);

    const moduleFixture = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should register with valid input and return 201', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'user@example.com',
        password: 'StrongPass123',
        organizationName: 'Test Restaurant',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.message).toBe('Account registered successfully');
        expect(body.accessToken).toBe('test-access-token');
      });

    expect(authServiceMock.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'user@example.com',
      password: 'StrongPass123',
      organizationName: 'Test Restaurant',
    });
  });

  it('should reject invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
        organizationName: 'X',
      })
      .expect(400);

    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should reject unknown registration fields', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'user@example.com',
        password: 'StrongPass123',
        organizationName: 'Test Restaurant',
        isAdmin: true,
      })
      .expect(400);

    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should log in with valid input and return 200', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'StrongPass123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Login successful');
        expect(body.accessToken).toBe('test-access-token');
        expect(body.tokenType).toBe('Bearer');
      });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'StrongPass123',
    });
  });

  it('should reject invalid login input', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'invalid-email',
        password: '',
      })
      .expect(400);

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should reject /me without a token', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });

  it('should return the current user for a valid JWT', async () => {
    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'user@example.com',
    });

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
          },
        });
      });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });
  });
});
