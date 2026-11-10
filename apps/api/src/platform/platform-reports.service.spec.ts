import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlatformReportsService } from './platform-reports.service.js';

describe('PlatformReportsService', () => {
  const service = new PlatformReportsService({} as PrismaService);

  it('rejects a report range that does not move forward', async () => {
    await expect(
      service.report({
        from: '2026-10-22T00:00:00.000Z',
        to: '2026-10-22T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
