import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { YcCountriesController } from './yc-countries.controller';
import { YcCountriesService } from './yc-countries.service';
import { CountrySchema } from './schemas/yc-country.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: 'CountryCache', schema: CountrySchema },
    ]),
  ],
  controllers: [YcCountriesController],
  providers: [YcCountriesService],
  exports: [YcCountriesService],
})
export class YcCountriesModule {}
