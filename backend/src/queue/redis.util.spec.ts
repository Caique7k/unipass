import { ConfigService } from '@nestjs/config';
import { getRedisOptions } from './redis.util';

describe('getRedisOptions', () => {
  it('habilita TLS quando a conexao usa rediss', () => {
    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('rediss://default:secret@cache.example.com:6379'),
    } as unknown as ConfigService;

    expect(getRedisOptions(configService)).toEqual({
      lazyConnect: true,
      maxRetriesPerRequest: null,
      url: 'rediss://default:secret@cache.example.com:6379',
      tls: {},
    });
  });

  it('mantem conexao sem TLS quando a url usa redis', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('redis://:secret@127.0.0.1:6379/0'),
    } as unknown as ConfigService;

    expect(getRedisOptions(configService)).toEqual({
      lazyConnect: true,
      maxRetriesPerRequest: null,
      url: 'redis://:secret@127.0.0.1:6379/0',
    });
  });
});
