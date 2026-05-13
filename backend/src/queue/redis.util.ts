import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

type RedisOptionsWithUrl = RedisOptions & {
  url: string;
};

export function getRedisOptions(
  configService: ConfigService,
): RedisOptionsWithUrl {
  const url = configService.getOrThrow<string>('REDIS_URL').trim();
  const redisUrl = new URL(url);

  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    url,
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

export function createRedisConnection(configService: ConfigService): Redis {
  return new Redis(getRedisOptions(configService));
}
