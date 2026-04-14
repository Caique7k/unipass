import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NotificationWorkerModule } from './queue/notification-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    NotificationWorkerModule,
    {
      logger: ['error', 'warn', 'log'],
    },
  );
  const logger = new Logger('NotificationWorkerBootstrap');

  logger.log('Worker de notificacoes iniciado.');

  const shutdown = async (signal: string) => {
    logger.log(`Encerrando worker por sinal ${signal}.`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
