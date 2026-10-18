import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class DistributedLockService {
  private readonly prefix = 'lock';

  constructor(private readonly redisService: RedisService) {}

  async acquire(name: string, ttlSeconds: number = 10): Promise<string | null> {
    const key = this.buildKey(name);
    const token = randomUUID();

    const acquired = await this.redisService.setIfNotExists(key, token, ttlSeconds);

    return acquired ? token : null;
  }

  async release(name: string, token: string): Promise<boolean> {
    const key = this.buildKey(name);

    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end

      return 0
    `;

    const result = await this.redisService.eval(script, [key], [token]);

    return Number(result) === 1;
  }

  private buildKey(name: string): string {
    return `${this.prefix}${name}`;
  }
}
