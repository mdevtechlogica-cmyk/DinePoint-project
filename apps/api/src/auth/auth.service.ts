import {
    ConflictException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import * as argon2 from 'argon2';
  import { randomBytes } from 'node:crypto';
  
  import { PrismaService } from '../prisma/prisma.service.js';
  import { RegisterDto } from './dto/register.dto.js';
  import { LoginDto } from './dto/login.dto.js';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
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
  
        const accessToken = await this.createAccessToken(result.user);
  
        return {
          message: 'Account registered successfully',
          user: result.user,
          organization: result.organization,
          accessToken,
          tokenType: 'Bearer',
          expiresIn: this.config.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ),
        };
      } catch (error) {
        // P2002 is Prisma's unique-constraint error.
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
  
      const accessToken = await this.createAccessToken(user);
  
      const memberships =
        await this.prisma.organizationMember.findMany({
          where: {
            userId: user.id,
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
  
      return {
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        memberships,
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ),
      };
    }
  
    private async createAccessToken(user: {
      id: string;
      email: string;
    }) {
      return this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      });
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