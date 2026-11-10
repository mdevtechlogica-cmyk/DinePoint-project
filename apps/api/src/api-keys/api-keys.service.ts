
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  API_KEY_SCOPES,
  type ApiKeyScope,
  CreateApiKeyDto,
} from './dto/create-api-key.dto.js';

const hashKey = (key: string): string =>
  createHash('sha256').update(key, 'utf8').digest('hex');

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) { }

  async create(
    organizationId: string,
    createdByUserId: string,
    dto: CreateApiKeyDto,
  ) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, isActive: true },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const scopes = dto.scopes as ApiKeyScope[];

    if (
      !Array.isArray(scopes) ||
      scopes.some((scope) => !API_KEY_SCOPES.includes(scope))
    ) {
      throw new BadRequestException('One or more API-key scopes are invalid');
    }

    let expiresAt: Date | null = null;

    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);

      if (
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException('Expiry must be a future date');
      }
    }

    // The raw key is returned once and is never persisted.
    const rawKey = `dp_live_${randomBytes(32).toString('base64url')}`;
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 16);

    const record = await this.prisma.apiKey.create({
      data: {
        organizationId,
        createdByUserId,
        name: dto.name.trim(),
        keyHash,
        keyPrefix,
        scopes: [...new Set(scopes)],
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...record,
      apiKey: rawKey,
      warning: 'Copy this key now. It cannot be retrieved again.',
    };
  }

  async list(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(organizationId: string, id: string) {
    const result = await this.prisma.apiKey.updateMany({
      where: {
        id,
        organizationId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count !== 1) {
      throw new NotFoundException('Active API key not found');
    }

    return { success: true };
  }


  async authenticate(rawKey: string) {
    if (
      typeof rawKey !== 'string' ||
      !rawKey.startsWith('dp_live_') ||
      rawKey.length > 200
    ) {
      return null;
    }

    const now = new Date();

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashKey(rawKey) },
      select: {
        id: true,
        organizationId: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        organization: {
          select: { isActive: true },
        },
      },
    });

    if (
      !record ||
      record.revokedAt ||
      (record.expiresAt && record.expiresAt <= now) ||
      !record.organization.isActive
    ) {
      return null;
    }

    // Only mark usage if the key is still active and unexpired.
    const result = await this.prisma.apiKey.updateMany({
      where: {
        id: record.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      data: { lastUsedAt: now },
    });

    if (result.count !== 1) {
      return null;
    }

    return {
      id: record.id,
      organizationId: record.organizationId,
      scopes: record.scopes,
    };
  }

}
