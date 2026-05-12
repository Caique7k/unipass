import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function getRedisOptions(configService: ConfigService): RedisOptions {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,

    // URL COMPLETA DO REDIS
    url: configService.get<string>('REDIS_URL'),
  } as RedisOptions & {
    url?: string;
  };
}
