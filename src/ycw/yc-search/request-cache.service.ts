import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

const TTL_30_DAYS = 60 * 60 * 24 * 30; // 30 днів у секундах

@Injectable()
export class RequestCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestCacheService.name);
  private client: RedisClientType;
  private connected = false;

  private readonly pending = new Map<string, Promise<any>>();

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

    this.client = createClient({ url: redisUrl }) as RedisClientType;

    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
      this.connected = true;
    });

    try {
      await this.client.connect();
    } catch (err: unknown) {
      this.logger.warn(
        `Redis unavailable, falling back to in-memory: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  // ─── GET ───────────────────────────────────────────────────────
  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;

    try {
      const raw = await this.client.get(key);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      this.logger.warn(
        `Redis GET error for key "${key}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  // ─── SET ───────────────────────────────────────────────────────
  // ttlSeconds — TTL в секундах, default 30 днів
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.connected) return;

    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds ?? TTL_30_DAYS;
      await this.client.set(key, serialized, { EX: ttl });
    } catch (err: unknown) {
      this.logger.warn(
        `Redis SET error for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  // ─── PENDING (in-memory, як і раніше) ─────────────────────────
  getPending<T>(key: string): Promise<T> | null {
    return (this.pending.get(key) as Promise<T>) ?? null;
  }

  setPending<T>(key: string, promise: Promise<T>) {
    this.pending.set(key, promise);
  }

  clearPending(key: string) {
    this.pending.delete(key);
  }
}
