import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type TrackerRequest = {
  ips?: string[];
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class SecurityThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: TrackerRequest): Promise<string> {
    if (Array.isArray(req.ips) && req.ips.length > 0) {
      return Promise.resolve(req.ips[0]);
    }

    return Promise.resolve(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return super.shouldSkip(context);
  }
}
