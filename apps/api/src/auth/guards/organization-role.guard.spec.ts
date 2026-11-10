
import {
    ForbiddenException,
    type ExecutionContext,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { OrganizationRole } from '@prisma/client';
  import { beforeEach, describe, expect, it, vi } from 'vitest';
  
  import { OrganizationRoleGuard } from './organization-role.guard.js';
  import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-roles.decorator.js';
  
  describe('OrganizationRoleGuard', () => {
    const getAllAndOverride = vi.fn();
  
    const reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
  
    const guard = new OrganizationRoleGuard(reflector);
  
    function createContext(request: Record<string, any>) {
      return {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext;
    }
  
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it('allows OWNER when OWNER is required', () => {
      getAllAndOverride.mockReturnValue([OrganizationRole.OWNER]);
  
      const result = guard.canActivate(
        createContext({
          organizationMembership: {
            organizationId: 'org-a',
            role: OrganizationRole.OWNER,
          },
        }),
      );
  
      expect(result).toBe(true);
    });
  
    it('allows ADMIN when ADMIN is required', () => {
      getAllAndOverride.mockReturnValue([OrganizationRole.OWNER, OrganizationRole.ADMIN]);
  
      const result = guard.canActivate(
        createContext({
          organizationMembership: {
            organizationId: 'org-a',
            role: OrganizationRole.ADMIN,
          },
        }),
      );
  
      expect(result).toBe(true);
    });
  
    it('rejects STAFF when only OWNER and ADMIN are allowed', () => {
      getAllAndOverride.mockReturnValue([OrganizationRole.OWNER, OrganizationRole.ADMIN]);
  
      expect(() =>
        guard.canActivate(
          createContext({
            organizationMembership: {
              organizationId: 'org-a',
              role: OrganizationRole.STAFF,
            },
          }),
        ),
      ).toThrow(ForbiddenException);
    });
  
    it('rejects requests without organization membership', () => {
      getAllAndOverride.mockReturnValue([OrganizationRole.OWNER]);
  
      expect(() =>
        guard.canActivate(createContext({})),
      ).toThrow(ForbiddenException);
    });
  
    it('allows requests when no roles are configured', () => {
      getAllAndOverride.mockReturnValue(undefined);
  
      const result = guard.canActivate(createContext({}));
  
      expect(result).toBe(true);
    });
  
    it('reads role metadata from the handler and controller', () => {
      getAllAndOverride.mockReturnValue([OrganizationRole.OWNER]);
  
      const context = createContext({
        organizationMembership: {
          organizationId: 'org-a',
          role: OrganizationRole.OWNER,
        },
      });
  
      guard.canActivate(context);
  
      expect(getAllAndOverride).toHaveBeenCalledWith(
        ORGANIZATION_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });
  