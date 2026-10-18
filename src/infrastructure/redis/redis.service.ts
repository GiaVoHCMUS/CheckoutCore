import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisClient } from './redis.client';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly keyPrefix: string;
  private readonly redis: Redis;

  readonly pub: Redis;
  readonly sub: Redis;

  constructor(private readonly configService: ConfigService) {
    this.keyPrefix = this.configService.get<string>('redis.keyPrefix') ?? '';

    this.redis = RedisClient.create(configService);
    // Redis Pub/Sub cần connection riêng.
    this.pub = RedisClient.create(configService);
    this.sub = RedisClient.create(configService);
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([this.redis.connect(), this.pub.connect(), this.sub.connect()]);

    await this.redis.ping();
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled([this.redis.quit(), this.pub.quit(), this.sub.quit()]);
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async set(key: string, value: string | Buffer | number, expiration?: number): Promise<boolean> {
    const result =
      expiration && expiration > 0
        ? await this.redis.set(key, value, 'EX', expiration)
        : await this.redis.set(key, value);

    return result == 'OK';
  }

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  expire(key: string, expiration: number): Promise<number> {
    return this.redis.expire(key, expiration);
  }

  exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  increase(key: string, increment = 1): Promise<number> {
    return this.redis.incrby(key, increment);
  }

  decrease(key: string, decrement = 1): Promise<number> {
    return this.redis.decrby(key, decrement);
  }

  sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  srem(key: string, ...members: string[]): Promise<number> {
    return this.redis.srem(key, ...members);
  }

  scard(key: string): Promise<number> {
    return this.redis.scard(key);
  }

  publish<T>(channel: string, message: T): Promise<number> {
    return this.pub.publish(channel, JSON.stringify(message));
  }

  async subcribe<T>(channel: string, handler: (message: T) => void) {
    await this.sub.subscribe(channel);

    this.sub.on('message', (receivedChannel, message) => {
      if (receivedChannel !== channel) {
        return;
      }

      handler(JSON.parse(message) as T);
    });
  }

  async setIfNotExists(key: string, value: string, expiration: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', expiration, 'NX');

    return result === 'OK';
  }

  eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.redis.eval(script, keys.length, ...keys, ...args);
  }

  async unlinkByPattern(pattern: string): Promise<number> {
    const scanCount = 200;
    const unlinkBatchSize = 100;
    const physicalPattern = `${this.keyPrefix}${pattern}`;

    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', physicalPattern, 'COUNT', scanCount);

      cursor = nextCursor;

      if (keys.length === 0) {
        continue;
      }

      const logicalKeys = this.keyPrefix
        ? keys.map((key) => (key.startsWith(this.keyPrefix) ? key.slice(this.keyPrefix.length) : key))
        : keys;

      for (let index = 0; index < logicalKeys.length; index += unlinkBatchSize) {
        const batch = logicalKeys.slice(index, index + unlinkBatchSize);

        deletedCount += await this.redis.unlink(...batch);
      }
    } while (cursor !== '0');

    return deletedCount;
  }
}
