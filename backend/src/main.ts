import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { CookieOriginGuard } from './security/cookie-origin.guard';
import {
  normalizeOrigin,
  parseAllowedOrigins,
} from './security/allowed-origins.util';
import { OpaqueIdRequestInterceptor } from './security/opaque-id-request.interceptor';
import { OpaqueIdResponseInterceptor } from './security/opaque-id-response.interceptor';
import { SecurityThrottlerGuard } from './security/security-throttler.guard';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>('FRONTEND_URLS'),
  );
  const port = Number(configService.get<string>('PORT') ?? '4000');
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (
        !origin ||
        (normalizedOrigin && allowedOrigins.includes(normalizedOrigin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(OpaqueIdRequestInterceptor),
    app.get(OpaqueIdResponseInterceptor),
  );
  app.useGlobalGuards(
    app.get(SecurityThrottlerGuard),
    app.get(CookieOriginGuard),
    app.get(JwtAuthGuard),
    app.get(RolesGuard),
  );

  await app.listen(port, host);
}

void bootstrap();
