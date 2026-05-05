import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCompareStrings } from 'src/security/secure-compare.util';

type ApiKeyRequest = {
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredApiKey = this.configService
      .get<string>('DEVICE_API_KEY')
      ?.trim();

    if (!configuredApiKey) {
      throw new UnauthorizedException('DEVICE_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const headerApiKey = request.headers['x-api-key'];
    const providedApiKey = Array.isArray(headerApiKey)
      ? headerApiKey[0]?.trim()
      : typeof headerApiKey === 'string'
        ? headerApiKey.trim()
        : undefined;

    if (!safeCompareStrings(providedApiKey, configuredApiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
