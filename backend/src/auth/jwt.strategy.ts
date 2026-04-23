import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { OpaqueIdService } from 'src/security/opaque-id.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly opaqueIdService: OpaqueIdService,
  ) {
    super({
      jwtFromRequest: (req) => {
        return req?.cookies?.token;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: this.opaqueIdService.decode(payload.sub),
      email: payload.email,
      name: payload.name,
      role: payload.role,
      companyId: this.opaqueIdService.decode(payload.companyId),
      emailDomain: payload.emailDomain ?? null,
      companyName: payload.companyName ?? null,
    };
  }
}
