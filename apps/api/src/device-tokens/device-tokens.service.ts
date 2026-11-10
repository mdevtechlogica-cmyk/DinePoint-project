import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto.js';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterDeviceTokenDto) {
    const token = dto.token.trim();
    const platform = dto.platform ?? 'ANDROID';

    const record = await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform,
        isActive: true,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
        token: true,
        platform: true,
        isActive: true,
        lastUsedAt: true,
      },
    });

    return {
      message: 'Device token registered',
      deviceToken: record,
    };
  }

  async unregister(userId: string, token: string) {
    const result = await this.prisma.deviceToken.updateMany({
      where: {
        userId,
        token: token.trim(),
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message:
        result.count > 0
          ? 'Device token unregistered'
          : 'Device token was not active for this user',
      deactivated: result.count,
    };
  }

  async listActiveTokensForUsers(userIds: string[]) {
    if (userIds.length === 0) {
      return [];
    }

    return this.prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        token: true,
      },
    });
  }

  async deactivateTokens(tokens: string[]) {
    if (tokens.length === 0) {
      return 0;
    }

    const result = await this.prisma.deviceToken.updateMany({
      where: {
        token: { in: tokens },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }
}
