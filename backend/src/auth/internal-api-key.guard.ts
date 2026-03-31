import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredApiKey =
      this.configService.get<string>('DEVICE_API_KEY')?.trim();

    if (!configuredApiKey) {
      throw new UnauthorizedException('DEVICE_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const headerApiKey = request.headers['x-api-key'];
    const providedApiKey = Array.isArray(headerApiKey)
      ? headerApiKey[0]
      : headerApiKey;

    if (!providedApiKey || providedApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
