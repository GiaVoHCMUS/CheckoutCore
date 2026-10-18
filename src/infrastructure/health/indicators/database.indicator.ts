import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  private readonly key = 'database';

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(this.key);
    const timeout = this.configService.getOrThrow<number>('health.databaseTimeout');
    const startTime = Date.now();

    try {
      await this.checkConnection(timeout);
      return indicator.up({
        duration: Date.now() - startTime,
      });
    } catch (error) {
      return indicator.down({
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Database is unavailable',
      });
    }
  }

  private async checkConnection(timeout: number): Promise<void> {
    await Promise.race([this.executeHealthQuery(), this.createTimeout(timeout)]);
  }

  private async executeHealthQuery(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      throw new Error('Database is not initialized');
    }

    await this.dataSource.query('SELECT 1');
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database health check timeout'));
      }, ms);
    });
  }
}
