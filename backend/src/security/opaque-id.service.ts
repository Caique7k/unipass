import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

const OPAQUE_ID_PREFIX = 'opk_';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class OpaqueIdService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('OPAQUE_ID_SECRET')?.trim() ||
      this.configService.getOrThrow<string>('JWT_SECRET');
  }

  encode(value: string | null | undefined) {
    if (!value || !this.isUuid(value)) {
      return value ?? null;
    }

    const payload = Buffer.from(value, 'utf8').toString('base64url');
    const signature = this.sign(payload);

    return `${OPAQUE_ID_PREFIX}${payload}.${signature}`;
  }

  decode(value: string | null | undefined) {
    if (!value) {
      return value ?? null;
    }

    if (this.isUuid(value)) {
      return value;
    }

    if (!this.isOpaqueId(value)) {
      return value;
    }

    const withoutPrefix = value.slice(OPAQUE_ID_PREFIX.length);
    const [payload, signature] = withoutPrefix.split('.');

    if (!payload || !signature) {
      return value;
    }

    const expectedSignature = this.sign(payload);
    const provided = Buffer.from(signature, 'utf8');
    const expected = Buffer.from(expectedSignature, 'utf8');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return value;
    }

    const decoded = Buffer.from(payload, 'base64url').toString('utf8');

    return this.isUuid(decoded) ? decoded : value;
  }

  encodeResponseIdentifiers<T>(payload: T): T {
    return this.transform(payload, 'encode');
  }

  decodeRequestIdentifiers<T>(payload: T): T {
    return this.transform(payload, 'decode');
  }

  private transform<T>(payload: T, direction: 'encode' | 'decode'): T {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.transform(item, direction)) as T;
    }

    if (payload instanceof Date || !this.isPlainObject(payload)) {
      return payload;
    }

    const transformed = Object.entries(payload).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[key] = this.transformValue(key, value, direction);
        return acc;
      },
      {},
    );

    return transformed as T;
  }

  private transformValue(
    key: string,
    value: unknown,
    direction: 'encode' | 'decode',
  ) {
    if (Array.isArray(value)) {
      if (this.shouldTransformArrayKey(key)) {
        return value.map((item) =>
          typeof item === 'string' ? this.transformString(key, item, direction) : item,
        );
      }

      return value.map((item) => this.transform(item, direction));
    }

    if (typeof value === 'string') {
      return this.transformString(key, value, direction);
    }

    if (value instanceof Date || !this.isPlainObject(value)) {
      return value;
    }

    return this.transform(value, direction);
  }

  private transformString(
    key: string,
    value: string,
    direction: 'encode' | 'decode',
  ) {
    if (key === 'busFilterKey' || key === 'value') {
      if (this.isUuid(value) || this.isOpaqueId(value)) {
        return direction === 'encode' ? this.encode(value) : this.decode(value);
      }

      if (value.startsWith('device-')) {
        const nestedValue = value.slice('device-'.length);
        const transformedNested =
          direction === 'encode'
            ? this.encode(nestedValue)
            : this.decode(nestedValue);

        return `device-${transformedNested}`;
      }

      if (key === 'busFilterKey') {
        return value;
      }
    }

    if (!this.shouldTransformKey(key)) {
      return value;
    }

    return direction === 'encode' ? this.encode(value) : this.decode(value);
  }

  private shouldTransformKey(key: string) {
    return key === 'id' || key === 'value' || key === 'ids' || /(?:^|[A-Z])\w*Id$/.test(key);
  }

  private shouldTransformArrayKey(key: string) {
    return key === 'ids' || /(?:^|[A-Z])\w*Ids$/.test(key);
  }

  private isOpaqueId(value: string) {
    return value.startsWith(OPAQUE_ID_PREFIX);
  }

  private isUuid(value: string) {
    return UUID_REGEX.test(value);
  }

  private sign(payload: string) {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    const prototype = Object.getPrototypeOf(value);

    return (
      typeof value === 'object' &&
      value !== null &&
      (prototype === Object.prototype || prototype === null)
    );
  }
}
