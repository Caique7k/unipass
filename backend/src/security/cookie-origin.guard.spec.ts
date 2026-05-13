import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CookieOriginGuard } from './cookie-origin.guard';

function createExecutionContext(request: Record<string, unknown>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('CookieOriginGuard', () => {
  function createGuard(frontendUrls = 'https://unipass-dusky.vercel.app') {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'FRONTEND_URLS') {
          return frontendUrls;
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    return new CookieOriginGuard(reflector, configService);
  }

  it('permite requisicao autenticada cross-site quando a origin esta na allowlist', () => {
    const guard = createGuard();
    const context = createExecutionContext({
      method: 'POST',
      headers: {
        cookie: 'token=abc',
        origin: 'https://unipass-dusky.vercel.app',
        'sec-fetch-site': 'cross-site',
      },
      protocol: 'https',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia requisicao autenticada cross-site quando a origin nao esta na allowlist', () => {
    const guard = createGuard();
    const context = createExecutionContext({
      method: 'POST',
      headers: {
        cookie: 'token=abc',
        origin: 'https://evil.example.com',
        'sec-fetch-site': 'cross-site',
      },
      protocol: 'https',
    });

    expect(() => guard.canActivate(context)).toThrow(
      'Origin not allowed for authenticated request',
    );
  });

  it('bloqueia requisicao cross-site sem origin ou referer confiaveis', () => {
    const guard = createGuard();
    const context = createExecutionContext({
      method: 'POST',
      headers: {
        cookie: 'token=abc',
        'sec-fetch-site': 'cross-site',
      },
      protocol: 'https',
    });

    expect(() => guard.canActivate(context)).toThrow(
      'Cross-site session requests are not allowed',
    );
  });
});
