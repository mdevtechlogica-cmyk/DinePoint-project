import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const baseSlug = this.slugify(dto.organizationName);
    const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email,
            passwordHash,
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });

        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName.trim(),
            slug,
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });

        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'OWNER',
          },
        });

        return { user, organization };
      });

      const tokens = await this.issueTokens(result.user);

      return {
        message: 'Account registered successfully',
        user: result.user,
        organization: result.organization,
        ...tokens,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with these details already exists',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    const memberships = await this.listMemberships(user.id);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      memberships,
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, status: true },
        },
      },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      stored.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    // Always return the same message to avoid account enumeration.
    const message =
      'If an account exists for that email, password reset instructions were sent.';

    if (!user || user.status !== 'ACTIVE') {
      return { message };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const mailResult = await this.mail.sendPasswordReset(user.email, rawToken);
    if (!mailResult.delivered) {
      this.logger.warn(
        `Password reset for ${user.email} expires ${expiresAt.toISOString()} (SMTP off; token logged by MailService).`,
      );
    }

    return {
      message,
      emailDelivered: mailResult.delivered,
      // Dev convenience only when explicitly enabled.
      ...(this.config.get<string>('EXPOSE_PASSWORD_RESET_TOKEN') === 'true'
        ? { resetToken: rawToken, resetLink: mailResult.link }
        : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, status: true } },
      },
    });

    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      stored.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Reset token is invalid or expired');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated. You can sign in with the new password.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not available');
    }

    const memberships = await this.listMemberships(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      memberships,
    };
  }

  private listMemberships(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: {
        userId,
        isActive: true,
        organization: { isActive: true },
      },
      select: {
        organizationId: true,
        role: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  private async issueTokens(user: { id: string; email: string }) {
    const accessToken = await this.createAccessToken(user);
    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = Number(
      this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS', '30'),
    );
    const expiresAt = new Date(
      Date.now() + Math.max(1, refreshDays) * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '7d');

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn,
      expiresInSeconds: this.parseDurationToSeconds(expiresIn),
    };
  }

  private async createAccessToken(user: { id: string; email: string }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToSeconds(value: string) {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return 7 * 24 * 60 * 60;
    const amount = Number(match[1]);
    const unit = match[2];
    const mult =
      unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return amount * mult;
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);

    return slug || 'restaurant';
  }
}
