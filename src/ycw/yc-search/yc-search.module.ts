import { Module } from '@nestjs/common';
import { YcSearchController } from './yc-search.controller';
import { YcSearchService } from './yc-search.service';
import { RequestCacheService } from './request-cache.service';

@Module({
  controllers: [YcSearchController],
  providers: [YcSearchService, RequestCacheService],
})
export class YcSearchModule {}
