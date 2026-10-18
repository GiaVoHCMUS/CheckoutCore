import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Injectable()
export class HealthService {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly databaseIndicator: DatabaseHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async checkLiveness(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
      info: {
        liveness: {
          status: 'up',
        },
      },
      error: {},
      details: {
        liveness: {
          status: 'up',
        },
      },
    };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.databaseIndicator.isHealthy(),
      () => this.redisIndicator.isHealthy(),
    ]);
  }
}
