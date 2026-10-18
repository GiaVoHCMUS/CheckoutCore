import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { ApiErrorResponse } from './api-error.response';

type RequestWithId = Request & { id: string };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();

    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();

    const { statusCode, error, message } = this.resolveException(exception);

    const requestId = String(request.id);
    const path = request.originalUrl;
    const method = request.method;

    const responseBody: ApiErrorResponse = {
      success: false,
      statusCode,
      requestId,
      error,
      message,
      path,
      method,
      timestamp: new Date().toISOString(),
    };

    this.logException(exception, method, path, statusCode, requestId);

    httpAdapter.reply(response, responseBody, statusCode);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal server error',
      };
    }

    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        statusCode,
        error: exception.name,
        message: response,
      };
    }

    const responseObject = response as {
      error?: string;
      message?: string | string[];
    };

    return {
      statusCode,
      error: responseObject.error ?? exception.name,
      message: responseObject.message ?? exception.message,
    };
  }

  private logException(exception: unknown, method: string, path: string, statusCode: number, requestId: string): void {
    const logContext = { requestId, method, path, statusCode };

    if (statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      const error = exception instanceof Error ? exception : new Error(String(exception));

      this.logger.error({ ...logContext, err: error }, 'Unhandled request exception');

      return;
    }

    this.logger.warn(logContext, 'Request failed');
  }
}
