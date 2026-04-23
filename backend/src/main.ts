import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { OpaqueIdResponseInterceptor } from './security/opaque-id-response.interceptor';
import { OpaqueIdService } from './security/opaque-id.service';
import { SecurityThrottlerGuard } from './security/security-throttler.guard';

function parseAllowedOrigins(value?: string) {
  const fallback = ['http://localhost:3000', 'http://localhost:3001'];

  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? origins : fallback;
}

function replaceObjectContents(
  target: Record<string, unknown> | undefined,
  nextValue: unknown,
) {
  if (
    !target ||
    typeof target !== 'object' ||
    !nextValue ||
    typeof nextValue !== 'object' ||
    Array.isArray(target) ||
    Array.isArray(nextValue)
  ) {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, nextValue);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>('FRONTEND_URLS'),
  );
  const opaqueIdService = app.get(OpaqueIdService);
  const port = Number(configService.get<string>('PORT') ?? '4000');
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  app.use(cookieParser());
  app.use((req, _res, next) => {
    if (req.params) {
      replaceObjectContents(
        req.params as Record<string, unknown>,
        opaqueIdService.decodeRequestIdentifiers(req.params),
      );
    }

    if (req.query) {
      replaceObjectContents(
        req.query as Record<string, unknown>,
        opaqueIdService.decodeRequestIdentifiers(req.query),
      );
    }

    if (req.body) {
      if (
        typeof req.body === 'object' &&
        req.body !== null &&
        !Array.isArray(req.body)
      ) {
        replaceObjectContents(
          req.body as Record<string, unknown>,
          opaqueIdService.decodeRequestIdentifiers(req.body),
        );
      } else {
        req.body = opaqueIdService.decodeRequestIdentifiers(req.body);
      }
    }

    next();
  });
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
  app.useGlobalInterceptors(new OpaqueIdResponseInterceptor(opaqueIdService));
  app.useGlobalGuards(
    app.get(SecurityThrottlerGuard),
    app.get(JwtAuthGuard),
    app.get(RolesGuard),
  );

  await app.listen(port, host);
}

bootstrap();
