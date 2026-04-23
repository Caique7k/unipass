import { Global, Module } from '@nestjs/common';
import { OpaqueIdRequestInterceptor } from './opaque-id-request.interceptor';
import { OpaqueIdResponseInterceptor } from './opaque-id-response.interceptor';
import { OpaqueIdService } from './opaque-id.service';
import { SecurityThrottlerGuard } from './security-throttler.guard';

@Global()
@Module({
  providers: [
    OpaqueIdService,
    OpaqueIdRequestInterceptor,
    OpaqueIdResponseInterceptor,
    SecurityThrottlerGuard,
  ],
  exports: [
    OpaqueIdService,
    OpaqueIdRequestInterceptor,
    OpaqueIdResponseInterceptor,
    SecurityThrottlerGuard,
  ],
})
export class SecurityModule {}
