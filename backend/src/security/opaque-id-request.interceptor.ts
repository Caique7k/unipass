import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OpaqueIdService } from './opaque-id.service';

function replaceObjectContents(
  target: Record<string, unknown> | undefined,
  nextValue: unknown,
) {
  if (
    !target ||
    typeof target !== 'object' ||
    !nextValue ||
    typeof nextValue !== 'object' ||
    Array.isArray(target) ||
    Array.isArray(nextValue)
  ) {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, nextValue);
}

@Injectable()
export class OpaqueIdRequestInterceptor implements NestInterceptor {
  constructor(private readonly opaqueIdService: OpaqueIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    if (request?.params) {
      replaceObjectContents(
        request.params as Record<string, unknown>,
        this.opaqueIdService.decodeRequestIdentifiers(request.params),
      );
    }

    if (request?.query) {
      replaceObjectContents(
        request.query as Record<string, unknown>,
        this.opaqueIdService.decodeRequestIdentifiers(request.query),
      );
    }

    if (request?.body !== undefined) {
      if (
        typeof request.body === 'object' &&
        request.body !== null &&
        !Array.isArray(request.body)
      ) {
        replaceObjectContents(
          request.body as Record<string, unknown>,
          this.opaqueIdService.decodeRequestIdentifiers(request.body),
        );
      } else {
        request.body = this.opaqueIdService.decodeRequestIdentifiers(
          request.body,
        );
      }
    }

    return next.handle();
  }
}
