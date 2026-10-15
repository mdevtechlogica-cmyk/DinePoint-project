import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Request } from 'express';
  
  import { PrismaService } from '../../prisma/prisma.service.js';
  import { AuthenticatedUser } from '../types/authenticated-user.js';
  
  type AuthenticatedRequest = Request & {
    user?: AuthenticatedUser;
    organizationMembership?: {
      organizationId: string;
      role: string;
    };
  };
  
  @Injectable()
  export class OrganizationMemberGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();
  
      const user = request.user;
      const organizationIdParam = request.params.organizationId;
      const organizationId = Array.isArray(organizationIdParam)
        ? organizationIdParam[0]
        : organizationIdParam;

      if (!user) {
        throw new UnauthorizedException('Authentication required');
      }

      if (!organizationId) {
        throw new ForbiddenException('Organization ID is required');
      }
  
      const membership =
        await this.prisma.organizationMember.findFirst({
          where: {
            userId: user.id,
            organizationId,
            isActive: true,
            organization: {
              isActive: true,
            },
          },
          select: {
            organizationId: true,
            role: true,
          },
        });
  
      if (!membership) {
        throw new ForbiddenException(
          'You do not have access to this organization',
        );
      }
  
      request.organizationMembership = membership;
  
      return true;
    }
  }