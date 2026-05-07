import { Injectable } from '@nestjs/common';

import { YcwHttpService } from '../ycw-http.service';
import { SearchEntitiesDto } from './search-entities.dto';
import { RequestCacheService } from './request-cache.service';

@Injectable()
export class YcSearchService {
  /**
   * TTL кешу
   * 1 година
   */
  private readonly CACHE_TTL = 1000 * 60 * 60;

  constructor(
    private readonly ycwHttp: YcwHttpService,
    private readonly requestCache: RequestCacheService,
  ) {}

  async search(dto: SearchEntitiesDto) {
    const cacheKey = this.buildCacheKey(dto);

    /**
     * 1. READY CACHE
     */
    const cached = this.requestCache.get<unknown>(cacheKey);

    if (cached) {
      console.log('[YC SEARCH] CACHE HIT');

      return cached;
    }

    /**
     * 2. IN-FLIGHT REQUEST
     */
    const pending = this.requestCache.getPending<unknown>(cacheKey);

    if (pending) {
      console.log('[YC SEARCH] PENDING HIT');

      return pending;
    }

    /**
     * 3. REAL REQUEST
     */
    console.log('[YC SEARCH] REAL API REQUEST');

    const requestPromise: Promise<unknown> = this.fetchAndCache(cacheKey, dto);

    /**
     * Реєструємо pending promise
     */
    this.requestCache.setPending(cacheKey, requestPromise);

    return requestPromise;
  }

  /**
   * Реальний API request
   */
  private async fetchAndCache(
    cacheKey: string,
    dto: SearchEntitiesDto,
  ): Promise<unknown> {
    try {
      const response = await this.ycwHttp.get('/GetEntities', {
        SearchString: dto.searchString?.trim() ?? null,
        SchemaName: dto.schemaName,
        Countries: dto.countries,
        DataSetIds: dto.dataSetIds,
        PageSize: dto.pageSize,
        Offset: dto.offset,
        IsPep: dto.isPep,
      });

      /**
       * Зберігаємо готовий response
       */
      this.requestCache.set(cacheKey, response, this.CACHE_TTL);

      return response;
    } finally {
      /**
       * ВАЖЛИВО:
       * pending треба чистити
       * навіть якщо request впав
       */
      this.requestCache.clearPending(cacheKey);
    }
  }

  /**
   * Стабільний cache key
   */
  private buildCacheKey(dto: SearchEntitiesDto): string {
    return JSON.stringify({
      searchString: dto.searchString?.trim().toLowerCase() ?? null,
      schemaName: dto.schemaName ?? null,

      countries: [...(dto.countries ?? [])].sort(),

      dataSetIds: [...(dto.dataSetIds ?? [])].sort(),

      pageSize: dto.pageSize ?? null,
      offset: dto.offset ?? null,
      isPep: dto.isPep ?? null,
    });
  }
}
