import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Neon free tier can be asleep; retry briefly so Render cold starts succeed.
    const maxAttempts = 5;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Database connect attempt ${attempt}/${maxAttempts} failed`,
        );
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        }
      }
    }
    this.logger.error(
      'Cannot reach DATABASE_URL host. On Render, set real Neon URLs (not placeholders), include ?sslmode=require, use the -pooler host for DATABASE_URL, and wake the Neon project if it is suspended.',
    );
    throw lastError;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
