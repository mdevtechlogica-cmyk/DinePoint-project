import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { OrganizationRole } from '@prisma/client';
  import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-roles.decorator.js';
  
  @Injectable()
  export class OrganizationRoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles =
        this.reflector.getAllAndOverride<OrganizationRole[]>(
          ORGANIZATION_ROLES_KEY,
          [context.getHandler(), context.getClass()],
        );
  
      if (!requiredRoles?.length) {
        return true;
      }
  
      const request = context
        .switchToHttp()
        .getRequest();
  
      const membership = request.organizationMembership;
  
      if (
        !membership ||
        !requiredRoles.includes(membership.role)
      ) {
        throw new ForbiddenException(
          'You do not have permission to manage restaurants.',
        );
      }
  
      return true;
    }
  }