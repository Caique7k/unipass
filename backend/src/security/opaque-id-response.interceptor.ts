import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OpaqueIdService } from './opaque-id.service';

@Injectable()
export class OpaqueIdResponseInterceptor implements NestInterceptor {
  constructor(private readonly opaqueIdService: OpaqueIdService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        map((payload) => this.opaqueIdService.encodeResponseIdentifiers(payload)),
      );
  }
}
