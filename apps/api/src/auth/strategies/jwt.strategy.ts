import {
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { PassportStrategy } from '@nestjs/passport';
  import { ExtractJwt, Strategy } from 'passport-jwt';
  
  import { PrismaService } from '../../prisma/prisma.service.js';
  import { AuthenticatedUser } from '../types/authenticated-user.js';
  
  interface JwtPayload {
    sub: string;
    email: string;
  }
  
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      config: ConfigService,
      private readonly prisma: PrismaService,
    ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    }
  
    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid access token');
      }
  
      // Check the account against the database so a suspended
      // user cannot continue accessing the API.
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });
  
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is unavailable');
      }
  
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
  }