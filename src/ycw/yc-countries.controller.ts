import { Controller, Get } from '@nestjs/common';
import { YcCountriesService } from './yc-countries.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('yc/countries')
export class YcCountriesController {
  constructor(private readonly ycCountriesService: YcCountriesService) {}

  @Public()
  @Get()
  async getCountries() {
    return this.ycCountriesService.getCountries();
  }

  @Get('status')
  async getStatus() {
    return this.ycCountriesService.hasCountries();
  }
}
