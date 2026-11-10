import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type AuditWriter = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PlatformAuditService {
  constructor(private readonly prisma: PrismaService) {}

  write(
    db: AuditWriter,
    input: {
      actorUserId: string;
      action: string;
      targetType: string;
      targetId?: string | null;
      description?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    return db.platformAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        description: input.description,
        metadata: input.metadata,
      },
    });
  }

  async record(input: {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    description?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.write(this.prisma, input);
  }
}
