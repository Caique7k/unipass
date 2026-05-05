import { Global, Module } from '@nestjs/common';
import { CookieOriginGuard } from './cookie-origin.guard';
import { OpaqueIdRequestInterceptor } from './opaque-id-request.interceptor';
import { OpaqueIdResponseInterceptor } from './opaque-id-response.interceptor';
import { OpaqueIdService } from './opaque-id.service';
import { SecurityThrottlerGuard } from './security-throttler.guard';

@Global()
@Module({
  providers: [
    CookieOriginGuard,
    OpaqueIdService,
    OpaqueIdRequestInterceptor,
    OpaqueIdResponseInterceptor,
    SecurityThrottlerGuard,
  ],
  exports: [
    CookieOriginGuard,
    OpaqueIdService,
    OpaqueIdRequestInterceptor,
    OpaqueIdResponseInterceptor,
    SecurityThrottlerGuard,
  ],
})
export class SecurityModule {}
