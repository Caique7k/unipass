import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/auth/public.decorator';
import { normalizeOrigin, parseAllowedOrigins } from './allowed-origins.util';

@Injectable()
export class CookieOriginGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    if (!this.hasTokenCookie(request)) {
      return true;
    }

    const fetchSite = this.readHeaderValue(request, 'sec-fetch-site');

    if (fetchSite === 'cross-site') {
      throw new ForbiddenException(
        'Cross-site session requests are not allowed',
      );
    }

    const allowedOrigins = new Set(
      parseAllowedOrigins(this.configService.get<string>('FRONTEND_URLS')),
    );
    const requestOrigin = this.resolveRequestOrigin(request);

    if (requestOrigin) {
      allowedOrigins.add(requestOrigin);
    }

    const origin = normalizeOrigin(this.readHeaderValue(request, 'origin'));

    if (origin) {
      if (!allowedOrigins.has(origin)) {
        throw new ForbiddenException(
          'Origin not allowed for authenticated request',
        );
      }

      return true;
    }

    const refererOrigin = normalizeOrigin(
      this.readHeaderValue(request, 'referer'),
    );

    if (refererOrigin && !allowedOrigins.has(refererOrigin)) {
      throw new ForbiddenException(
        'Referer not allowed for authenticated request',
      );
    }

    return true;
  }

  private readHeaderValue(request: Request, name: string) {
    const value = request.headers[name];

    if (Array.isArray(value)) {
      return value[0]?.trim().toLowerCase() ?? null;
    }

    return typeof value === 'string' ? value.trim().toLowerCase() : null;
  }

  private hasTokenCookie(request: Request) {
    const cookieHeader = this.readHeaderValue(request, 'cookie');

    if (!cookieHeader) {
      return false;
    }

    return cookieHeader
      .split(';')
      .some((cookie) => cookie.trim().startsWith('token='));
  }

  private resolveRequestOrigin(request: Request) {
    const host =
      this.readHeaderValue(request, 'x-forwarded-host') ??
      this.readHeaderValue(request, 'host');

    if (!host) {
      return null;
    }

    const forwardedProto = this.readHeaderValue(request, 'x-forwarded-proto');
    const protocol =
      forwardedProto?.split(',')[0]?.trim() || request.protocol || 'http';

    return normalizeOrigin(`${protocol}://${host}`);
  }
}
