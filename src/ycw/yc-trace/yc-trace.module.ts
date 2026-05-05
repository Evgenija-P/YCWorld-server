import { Module } from '@nestjs/common';
import { YcTraceController } from './yc-trace.controller';
import { YcTraceService } from './yc-trace.service';

@Module({
  controllers: [YcTraceController],
  providers: [YcTraceService],
})
export class YcTraceModule {}
