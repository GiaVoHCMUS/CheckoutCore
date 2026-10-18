import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResult } from '@nestjs/terminus';

@ApiExcludeController()
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  checkLiveness(): Promise<HealthCheckResult> {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  checkReadiness(): Promise<HealthCheckResult> {
    return this.healthService.checkReadiness();
  }
}
