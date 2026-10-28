import { Injectable, Module } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
  async check(): Promise<unknown> {
    return { status: 'ok', info: {}, error: {}, details: {} };
  }
}

@Injectable()
export class HealthIndicatorService {
  check(key: string) {
    return {
      up: (details: object) => ({ [key]: { status: 'up', ...details } }),
      down: (details: object) => ({ [key]: { status: 'down', ...details } }),
    };
  }
}

@Module({
  providers: [HealthCheckService, HealthIndicatorService],
  exports: [HealthCheckService, HealthIndicatorService],
})
export class TerminusModule {}
