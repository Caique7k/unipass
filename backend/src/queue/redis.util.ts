import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function getRedisOptions(configService: ConfigService): RedisOptions {
  return {
    host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
    port: Number(configService.get<string>('REDIS_PORT') ?? '6379'),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: Number(configService.get<string>('REDIS_DB') ?? '0'),
  };
}
