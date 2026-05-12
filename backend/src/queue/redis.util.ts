import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function getRedisOptions(configService: ConfigService): RedisOptions {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,

    ...(configService.get<string>('REDIS_URL')
      ? {
          host: undefined,
          port: undefined,

          // ioredis aceita connection string via "url"
          // mas o tipo RedisOptions não mostra isso direito
        }
      : {
          host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(configService.get<string>('REDIS_PORT') ?? '6379'),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        }),
  } as RedisOptions & {
    url?: string;
  };
}
