import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiSuccessResponse } from './api-success.response';
import { Observable, map } from 'rxjs';
import { PaginatedResult, PaginationMeta } from './pagination/paginated-result';

type RequestWithId = Request & { id: string };
type GlobalResponse<T> = ApiSuccessResponse<T> | ApiSuccessResponse<unknown[], PaginationMeta> | undefined;

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'items' in value && Array.isArray(value.items) && 'meta' in value;
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<T, GlobalResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<GlobalResponse<T>> {
    const httpContext = context.switchToHttp();

    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((result) => {
        // Response 204 không được có body
        if (response.statusCode === Number(HttpStatus.NO_CONTENT)) {
          return undefined;
        }

        const baseResponse = {
          success: true as const,
          statusCode: response.statusCode,
          requestId: request.id,
          timestamp: new Date().toISOString(),
        };

        if (isPaginatedResult(result)) {
          return {
            ...baseResponse,
            data: result.items,
            meta: result.meta,
          };
        }

        return {
          ...baseResponse,
          data: result,
        };
      }),
    );
  }
}
