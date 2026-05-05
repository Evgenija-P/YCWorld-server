import { Module } from '@nestjs/common';
import { YcSearchController } from './yc-search.controller';
import { YcSearchService } from './yc-search.service';

@Module({
  controllers: [YcSearchController],
  providers: [YcSearchService],
})
export class YcSearchModule {}
