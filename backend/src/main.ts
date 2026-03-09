import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001', 'http://192.168.100.143:3001'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // erro se enviar campo extra
      transform: true, // transforma payload em instância do DTO
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
