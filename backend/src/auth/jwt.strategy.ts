import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        return req?.cookies?.token;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      companyId: payload.companyId,
      emailDomain: payload.emailDomain ?? null,
    };
  }
}
