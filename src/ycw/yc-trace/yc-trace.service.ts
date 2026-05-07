import { Injectable } from '@nestjs/common';

import { YcwHttpService } from '../ycw-http.service';
import { RequestCacheService } from '../yc-search/request-cache.service';

@Injectable()
export class YcTraceService {
  constructor(
    private readonly ycwHttp: YcwHttpService,
    private readonly requestCache: RequestCacheService,
  ) {}

  private normalizeId(id: string): string {
    return id.replace(/\//g, '_');
  }

  async getRiskCountryTrace(entityId: string) {
    return this.getCachedTrace(
      'risk-country',
      entityId,
      `/Trace/${this.normalizeId(entityId)}/get-entity-trace`,
    );
  }

  async getSanctionsTrace(entityId: string) {
    return this.getCachedTrace(
      'sanctions',
      entityId,
      `/Trace/${this.normalizeId(entityId)}/get-entity-sanctions-trace`,
    );
  }

  async getPepTrace(entityId: string) {
    return this.getCachedTrace(
      'pep',
      entityId,
      `/Trace/${this.normalizeId(entityId)}/get-entity-pep-trace`,
    );
  }

  private async getCachedTrace(
    traceType: string,
    entityId: string,
    endpoint: string,
  ): Promise<unknown> {
    const cacheKey = `trace:${traceType}:${entityId}`;

    /**
     * CACHE
     */
    const cached = this.requestCache.get<unknown>(cacheKey);

    if (cached) {
      console.log(`[YC TRACE] CACHE HIT ${traceType}`);

      return cached;
    }

    /**
     * PENDING
     */
    const pending = this.requestCache.getPending<unknown>(cacheKey);

    if (pending) {
      console.log(`[YC TRACE] PENDING HIT ${traceType}`);

      return pending;
    }

    /**
     * REAL REQUEST
     */
    console.log(`[YC TRACE] REAL API REQUEST ${traceType}`);

    const requestPromise = this.fetchAndCache(cacheKey, endpoint);

    this.requestCache.setPending(cacheKey, requestPromise);

    return requestPromise;
  }

  private async fetchAndCache(
    cacheKey: string,
    endpoint: string,
  ): Promise<unknown> {
    try {
      const response = await this.ycwHttp.get<unknown>(endpoint);

      this.requestCache.set(cacheKey, response, this.getMsUntilEndOfDay());

      console.log(`[YC TRACE RESPONSE] ${cacheKey}`, response);
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
