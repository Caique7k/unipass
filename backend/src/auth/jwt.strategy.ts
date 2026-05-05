import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { OpaqueIdService } from 'src/security/opaque-id.service';

type JwtCookieRequest = {
  cookies?: {
    token?: string;
  };
};

type JwtPayload = {
  sub?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly opaqueIdService: OpaqueIdService,
  ) {
    super({
      jwtFromRequest: (req?: JwtCookieRequest) => {
        return req?.cookies?.token ?? null;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const userId = this.opaqueIdService.decode(payload.sub);

    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
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
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      emailDomain: user.company?.emailDomain ?? null,
      companyName: user.company?.name ?? null,
    };
  }
}
