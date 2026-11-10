import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

@Controller('rate-limit-test')
class RateLimitTestController {
  @Get()
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  get() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
  ],
  controllers: [RateLimitTestController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
class RateLimitTestModule {}

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [RateLimitTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows requests within the limit and rejects excess requests with 429', async () => {
    const url = '/api/rate-limit-test';

    await request(app.getHttpServer()).get(url).expect(200);
    await request(app.getHttpServer()).get(url).expect(200);
    await request(app.getHttpServer()).get(url).expect(429);
  });
});
