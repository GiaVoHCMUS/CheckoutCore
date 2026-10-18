import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from 'src/infrastructure/redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  private readonly key = 'redis';

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(this.key);
    const timeout = this.configService.getOrThrow<number>('health.redisTimeout');
    const startTime = Date.now();

    try {
      await this.checkConnection(timeout);

      return indicator.up({
        duration: Date.now() - startTime,
      });
    } catch (error) {
      return indicator.down({
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Redis is unavailable',
      });
    }
  }

  private async checkConnection(timeout: number): Promise<void> {
    await Promise.race([this.executePing(), this.createTimeout(timeout)]);
  }

  private async executePing(): Promise<void> {
    const response = await this.redisService.ping();

    if (response !== 'PONG') {
      throw new Error(`Unexpected Redis response: ${response}`);
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Redis health check timeout'));
      }, ms);
    });
  }
}
