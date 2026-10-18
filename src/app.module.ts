import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { validate } from './config/env.validation';
import databaseConfig from './config/database.config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UserModule } from './modules/users/users.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import loggerConfig, { PinoLoggerModule } from './config/logger.config';
import redisConfig from './config/redis.config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import healthConfig from './infrastructure/health/health.config';
import { HealthModule } from './infrastructure/health/health.module';
import { GlobalResponseInterceptor } from './common/global-response.interceptor';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, loggerConfig, redisConfig, healthConfig],
      validate,
    }),

    PinoLoggerModule,
    DatabaseModule,
    RedisModule,
    CacheModule,
    HealthModule,

    UserModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
  ],
})
export class AppModule {}
