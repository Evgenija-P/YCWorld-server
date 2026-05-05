import { Module } from '@nestjs/common';
import { YcwCoreModule } from './ycw-core.module';
import { YcCountriesModule } from './yc-countries/yc-countries.module';
import { YcSchemasModule } from './yc-schemas/yc-schemas.module';
import { YcDatasetsModule } from './yc-datasets/yc-datasets.module';
import { YcSearchModule } from './yc-search/yc-search.module';
import { YcEntityModule } from './yc-entity/yc-entity.module';
import { YcTraceModule } from './yc-trace/yc-trace.module';

@Module({
  imports: [
    YcwCoreModule,
    YcCountriesModule,
    YcSchemasModule,
    YcDatasetsModule,
    YcSearchModule,
    YcEntityModule,
    YcTraceModule,
  ],
})
export class YcwModule {}
