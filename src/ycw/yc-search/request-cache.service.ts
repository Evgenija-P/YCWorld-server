import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

@Injectable()
export class RequestCacheService {
  private readonly cache = new LRUCache<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 60,
  });

  private readonly pending = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    return (this.cache.get(key) as T) ?? null;
  }

  set(key: string, value: any, ttl?: number) {
    this.cache.set(key, value, {
      ttl,
    });
  }

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
