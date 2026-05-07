import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YcSchemasController } from './yc-schemas.controller';
import { YcSchemasService } from './yc-schemas.service';
import { YcSchemasCacheSchema } from './yc-schemas.schema';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '../../settings/settings.module';

@Module({
  imports: [
    HttpModule,
    SettingsModule,
    MongooseModule.forFeature([
      { name: 'YcSchemasCache', schema: YcSchemasCacheSchema },
    ]),
  ],
  controllers: [YcSchemasController],
  providers: [YcSchemasService],
  exports: [YcSchemasService],
})
export class YcSchemasModule {}
