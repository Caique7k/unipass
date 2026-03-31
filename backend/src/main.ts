import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function parseAllowedOrigins(value?: string) {
  const fallback = ['http://localhost:3000', 'http://localhost:3001'];

  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? origins : fallback;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>('FRONTEND_URLS'),
  );
  const port = Number(configService.get<string>('PORT') ?? '4000');
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  app.use(cookieParser());
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

  await app.listen(port, host);
}

bootstrap();
