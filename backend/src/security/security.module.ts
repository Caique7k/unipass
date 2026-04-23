import { Global, Module } from '@nestjs/common';
import { OpaqueIdService } from './opaque-id.service';
import { SecurityThrottlerGuard } from './security-throttler.guard';

@Global()
@Module({
  providers: [OpaqueIdService, SecurityThrottlerGuard],
  exports: [OpaqueIdService, SecurityThrottlerGuard],
})
export class SecurityModule {}
