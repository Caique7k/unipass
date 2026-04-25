import { ConfigService } from '@nestjs/config';
import { OpaqueIdService } from './opaque-id.service';

describe('OpaqueIdService', () => {
  let service: OpaqueIdService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    service = new OpaqueIdService(configService);
  });

  it('does not throw when request payload contains nullish nested values', () => {
    const payload = {
      id: null,
      routeId: undefined,
      filters: [
        null,
        undefined,
        {
          busId: null,
          nested: {
            companyId: undefined,
          },
        },
      ],
      metadata: {
        ownerId: null,
        child: undefined,
      },
    };

    expect(() => service.decodeRequestIdentifiers(payload)).not.toThrow();
    expect(service.decodeRequestIdentifiers(payload)).toEqual(payload);
  });
});
