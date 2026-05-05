import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YcDatasetsController } from './yc-datasets.controller';
import { YcDatasetsService } from './yc-datasets.service';
import { YcDatasetsCacheSchema } from './yc-datasets.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'YcDatasetsCache', schema: YcDatasetsCacheSchema },
    ]),
  ],
  controllers: [YcDatasetsController],
  providers: [YcDatasetsService],
  exports: [YcDatasetsService],
})
export class YcDatasetsModule {}
