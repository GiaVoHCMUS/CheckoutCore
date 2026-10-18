import { IsEnum, IsIn, IsInt, IsString, Max, Min, validateSync } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

enum Enviroment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnviromentVariables {
  @IsEnum(Enviroment)
  NODE_ENV!: Enviroment;

  @IsString()
  APP_NAME!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  // Database configuration
  @IsString()
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  HEALTH_DATABASE_TIMEOUT!: number;

  @IsString()
  REDIS_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  REDIS_DB!: number;

  @IsString()
  REDIS_PASSWORD!: string;

  @IsString()
  REDIS_KEY_PREFIX!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  HEALTH_REDIS_TIMEOUT!: number;

  // Swagger configuration
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED!: string;

  // Logger configuration
  @IsIn(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
  LOG_LEVEL!: string;

  @IsIn(['true', 'false'])
  LOG_REDACT_ENABLED!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnviromentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
