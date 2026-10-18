import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

export interface CacheOptions {
  ttl?: number;
}

export interface CacheSingleFlightOptons extends CacheOptions {
  lockTtl?: number;
  lockWaitMs?: number;
  lockPollMs?: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = 3600;
  private readonly prefix = 'cache:';

  constructor(
    private readonly redisService: RedisService,
    private readonly distributedLockService: DistributedLockService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.buildKey(key);

    try {
      const value = await this.redisService.get(cacheKey);
      if (!value) {
        this.logger.debug(`Cache MISS: ${cacheKey}`);
        return null;
      }

      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache GET failed: ${cacheKey}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.buildKey(key);

    const ttl = options.ttl ?? this.defaultTtl;

    try {
      await this.redisService.set(cacheKey, JSON.stringify(value), ttl);

      this.logger.debug(`Cache SET: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache SET failed: ${cacheKey}`, error);
    }
  }

  async getOrSet<T>(key: string, fallback: () => Promise<T>, options: CacheOptions = {}) {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    this.logger.debug(`Loading cache key: ${key} from database`);
    const value = await fallback();

    await this.set(key, value, options);

    return value;
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);

    try {
      await this.redisService.del(cacheKey);

      this.logger.debug(`Cache DELETE: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache DELETE failed: ${cacheKey}`, error);
    }
  }

  async refresh(key: string, ttl = this.defaultTtl): Promise<void> {
    const cacheKey = this.buildKey(key);

    try {
      await this.redisService.expire(cacheKey, ttl);

      this.logger.debug(`Cache REFRESH: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache REFRESH failed: ${cacheKey}`, error);
    }
  }

  async getOrSetSingleFligt<T>(
    key: string,
    fallback: () => Promise<T>,
    options: CacheSingleFlightOptons = {},
  ): Promise<T> {
    const { lockTtl = 10, lockWaitMs = 3000, lockPollMs = 50 } = options;

    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const lockName = `single-flight:${key}`;

    const lockToken = await this.distributedLockService.acquire(lockName, lockTtl);

    if (lockToken) {
      try {
        // Double check sau khi lấy được lock.
        const recheck = await this.get<T>(key);

        if (recheck !== null) {
          return recheck;
        }
        const value = await fallback();

        await this.set(key, value, options);

        return value;
      } finally {
        await this.distributedLockService.release(lockName, lockToken);
      }
    }

    // Không lấy được lock -> có request khác đang load DB.
    const deadline = Date.now() + lockWaitMs;

    while (Date.now() < deadline) {
      await this.sleep(lockPollMs);

      const value = await this.get<T>(key);

      if (value !== null) {
        return value;
      }
    }

    // Không chờ mãi
    return fallback();
  }

  async invalidate(pattern: string): Promise<number> {
    const cachePattern = this.buildKey(pattern);

    try {
      const deletedCount = await this.redisService.unlinkByPattern(cachePattern);

      this.logger.debug(`Cache INVALIDATE: ${cachePattern} (${deletedCount} keys)`);

      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache INVALIDATE failed: ${cachePattern}`, error);

      return 0;
    }
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
