import { Module } from '@nestjs/common';
import { YcEntityController } from './yc-entity.controller';
import { YcEntityService } from './yc-entity.service';

@Module({
  controllers: [YcEntityController],
  providers: [YcEntityService],
})
export class YcEntityModule {}
