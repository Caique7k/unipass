import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

function parseRedisDatabase(pathname: string) {
  if (!pathname || pathname === '/') {
    return undefined;
  }

  const parsedDatabase = Number.parseInt(pathname.slice(1), 10);

  return Number.isNaN(parsedDatabase) ? undefined : parsedDatabase;
}

export function getRedisOptions(configService: ConfigService): RedisOptions {
  const url = configService.getOrThrow<string>('REDIS_URL').trim();
  const redisUrl = new URL(url);
  const database = parseRedisDatabase(redisUrl.pathname);

  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number.parseInt(redisUrl.port, 10) : 6379,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    ...(redisUrl.username
      ? { username: decodeURIComponent(redisUrl.username) }
      : {}),
    ...(redisUrl.password
      ? { password: decodeURIComponent(redisUrl.password) }
      : {}),
    ...(database !== undefined ? { db: database } : {}),
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

export function createRedisConnection(configService: ConfigService): Redis {
  return new Redis(getRedisOptions(configService));
}
