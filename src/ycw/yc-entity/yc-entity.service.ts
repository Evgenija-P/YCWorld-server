import { Injectable } from '@nestjs/common';

import { YcwHttpService } from '../ycw-http.service';
import { RequestCacheService } from '../yc-search/request-cache.service';

@Injectable()
export class YcEntityService {
  constructor(
    private readonly ycwHttp: YcwHttpService,
    private readonly requestCache: RequestCacheService,
  ) {}

  async getEntity(externalId: string) {
    const encoded = encodeURIComponent(externalId);

    const cacheKey = `entity:${encoded}`;

    /**
     * CACHE
     */
    const cached = await this.requestCache.get<unknown>(cacheKey);

    if (cached) {
      console.log('[YC ENTITY] CACHE HIT');

      return cached;
    }

    /**
     * PENDING
     */
    const pending = this.requestCache.getPending<unknown>(cacheKey);

    if (pending) {
      console.log('[YC ENTITY] PENDING HIT');

      return pending;
    }

    /**
     * REAL REQUEST
     */
    console.log('[YC ENTITY] REAL API REQUEST');

    const requestPromise: Promise<unknown> = this.fetchAndCache(
      cacheKey,
      encoded,
    );

    this.requestCache.setPending(cacheKey, requestPromise);

    console.log('requestPromise', requestPromise);

    return requestPromise;
  }

  private async fetchAndCache(
    cacheKey: string,
    encodedExternalId: string,
  ): Promise<unknown> {
    try {
      const response = await this.ycwHttp.get<unknown>(
        `/Entity/${encodedExternalId}/get-entity`,
      );

      await this.requestCache.set(cacheKey, response, 60 * 60 * 24 * 30); // 30 днів

      return response;
    } finally {
      this.requestCache.clearPending(cacheKey);
    }
  }

  private getMsUntilEndOfDay(): number {
    const now = new Date();

    const endOfDay = new Date();

    endOfDay.setHours(23, 59, 59, 999);

    return endOfDay.getTime() - now.getTime();
  }
}
