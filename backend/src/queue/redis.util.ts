import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function getRedisOptions(configService: ConfigService): RedisOptions {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,

    url: configService.get<string>('REDIS_URL'),

    tls: {},
  } as RedisOptions & {
    url?: string;
  };
}
