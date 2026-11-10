
import {
    ForbiddenException,
    UnauthorizedException,
    type ExecutionContext,
  } from '@nestjs/common';
  import { beforeEach, describe, expect, it, vi } from 'vitest';
  
  import { OrganizationMemberGuard } from './organization-member.guard.js';
  import { PrismaService } from '../../prisma/prisma.service.js';
  
  describe('OrganizationMemberGuard', () => {
    const findFirst = vi.fn();
  
    const prisma = {
      organizationMember: { findFirst },
    } as unknown as PrismaService;
  
    const guard = new OrganizationMemberGuard(prisma);
  
    function createContext(request: Record<string, any>) {
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;
    }
  
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it('rejects unauthenticated requests', async () => {
      const context = createContext({
        params: { organizationId: 'org-a' },
      });
  
      await expect(guard.canActivate(context))
        .rejects.toBeInstanceOf(UnauthorizedException);
  
      expect(findFirst).not.toHaveBeenCalled();
    });
  
    it('rejects requests without an organization ID', async () => {
      const context = createContext({
        user: { id: 'user-a' },
        params: {},
      });
  
      await expect(guard.canActivate(context))
        .rejects.toBeInstanceOf(ForbiddenException);
  
      expect(findFirst).not.toHaveBeenCalled();
    });
  
    it('allows an active organization member', async () => {
      findFirst.mockResolvedValue({
        organizationId: 'org-a',
        role: 'STAFF',
      });
  
      const request: Record<string, any> = {
        user: { id: 'user-a' },
        params: { organizationId: 'org-a' },
      };
  
      const result = await guard.canActivate(createContext(request));
  
      expect(result).toBe(true);
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-a',
          organizationId: 'org-a',
          isActive: true,
          organization: { isActive: true },
        },
        select: {
          organizationId: true,
          role: true,
        },
      });
      expect(request.organizationMembership).toEqual({
        organizationId: 'org-a',
        role: 'STAFF',
      });
    });
  
    it('rejects users without an active membership', async () => {
      findFirst.mockResolvedValue(null);
  
      const context = createContext({
        user: { id: 'user-a' },
        params: { organizationId: 'org-b' },
      });
  
      await expect(guard.canActivate(context))
        .rejects.toBeInstanceOf(ForbiddenException);
    });
  });
  