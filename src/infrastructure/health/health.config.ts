import { registerAs } from '@nestjs/config';

export default registerAs('health', () => ({
  databaseTimeout: Number(process.env.HEALTH_DATABASE_TIMEOUT ?? 2000),
  redisTimeout: Number(process.env.HEALTH_REDIS_TIMEOUT ?? 1000),
}));
