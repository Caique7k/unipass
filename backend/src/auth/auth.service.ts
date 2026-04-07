import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getTokenExpiration(rememberMe: boolean) {
    if (rememberMe) {
      return (
        (this.configService.get<string>(
          'JWT_REMEMBER_EXPIRES',
        ) as StringValue) ?? '30d'
      );
    }

    return (
      (this.configService.get<string>('JWT_EXPIRES') as StringValue) ?? '1h'
    );
  }

  async login(email: string, password: string, rememberMe = false) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            emailDomain: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      emailDomain: user.company?.emailDomain ?? null,
      companyName: user.company?.name ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.getTokenExpiration(rememberMe),
      }),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        companyId: true,
        company: {
          select: {
            emailDomain: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      emailDomain: user.company?.emailDomain ?? null,
      companyName: user.company?.name ?? null,
    };
  }
}
