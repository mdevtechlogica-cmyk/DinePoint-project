import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

type PlatformRequest = {
  user?: AuthenticatedUser;
  platformRole?: PlatformRole;
};

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { platformRole: true, status: true },
    });

    if (!record?.platformRole || record.status !== 'ACTIVE') {
      throw new ForbiddenException('Platform access is required.');
    }

    const required = this.reflector.getAllAndOverride<PlatformRole[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (required?.length && !required.includes(record.platformRole)) {
      throw new ForbiddenException(
        'You do not have permission for this platform action.',
      );
    }

    request.platformRole = record.platformRole;
    return true;
  }
}
