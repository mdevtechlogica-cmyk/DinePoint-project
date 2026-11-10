import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

export const PLATFORM_ROLES_KEY = 'platform_roles';

export const RequirePlatformRoles = (...roles: PlatformRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
