import { Controller, Get, Post } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { YcCountriesService } from './yc-countries.service';

@Controller('yc/countries')
export class YcCountriesController {
  constructor(private readonly ycCountriesService: YcCountriesService) {}

  // отримати країни (тільки з БД)
  @Public()
  @Get()
  async getCountries() {
    return this.ycCountriesService.getCountries();
  }

  // статус (для UI)
  @Get('status')
  async getStatus() {
    return this.ycCountriesService.getStatus();
  }

  // кнопка "оновити"
  @Post('update')
  async updateCountries() {
    return this.ycCountriesService.updateCountries();
  }
}
