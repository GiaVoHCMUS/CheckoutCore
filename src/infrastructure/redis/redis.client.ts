import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

const create = (configService: ConfigService, db?: number): Redis => {
  const options: RedisOptions = {
    host: configService.getOrThrow<string>('redis.host'),
    port: configService.getOrThrow<number>('redis.port'),
    db: db ?? configService.getOrThrow<number>('redis.db'),
    password: configService.get<string>('redis.password'),
    keyPrefix: configService.get<string>('redis.keyPrefix'),
    family: 4,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  };

  return new Redis(options);
};

export const RedisClient = {
  create,
};
