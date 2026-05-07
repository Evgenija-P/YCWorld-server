import { Module } from '@nestjs/common';
import { YcEntityController } from './yc-entity.controller';
import { YcEntityService } from './yc-entity.service';
import { RequestCacheService } from '../yc-search/request-cache.service';

@Module({
  controllers: [YcEntityController],
  providers: [YcEntityService, RequestCacheService],
})
export class YcEntityModule {}
