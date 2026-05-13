import { ConfigService } from '@nestjs/config';
import { getRedisOptions } from './redis.util';

describe('getRedisOptions', () => {
  it('converte a url rediss em opcoes aceitas pelo ioredis', () => {
    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('rediss://default:secret@cache.example.com:6379/4'),
    } as unknown as ConfigService;

    expect(getRedisOptions(configService)).toEqual({
      db: 4,
      host: 'cache.example.com',
      lazyConnect: true,
      maxRetriesPerRequest: null,
      password: 'secret',
      port: 6379,
      tls: {},
      username: 'default',
    });
  });

  it('mantem conexao redis simples sem tls e sem username vazio', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('redis://:secret@127.0.0.1:6379/0'),
    } as unknown as ConfigService;

    expect(getRedisOptions(configService)).toEqual({
      db: 0,
      host: '127.0.0.1',
      lazyConnect: true,
      maxRetriesPerRequest: null,
      password: 'secret',
      port: 6379,
    });
  });
});
