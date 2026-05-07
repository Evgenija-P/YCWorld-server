import { Module } from '@nestjs/common';
import { YcTraceController } from './yc-trace.controller';
import { YcTraceService } from './yc-trace.service';
import { RequestCacheService } from '../yc-search/request-cache.service';

@Module({
  controllers: [YcTraceController],
  providers: [YcTraceService, RequestCacheService],
})
export class YcTraceModule {}
