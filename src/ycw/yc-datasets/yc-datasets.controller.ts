import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { YcDatasetsService } from './yc-datasets.service';

@ApiTags('YC Datasets')
@ApiBearerAuth('JWT-auth')
@Controller('yc/datasets')
export class YcDatasetsController {
  constructor(private readonly ycDatasetsService: YcDatasetsService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список датасетів (з кешу БД)' })
  getDatasets() {
    return this.ycDatasetsService.getDatasets();
  }

  @Get('status')
  @ApiOperation({ summary: 'Статус кешу datasets' })
  getStatus() {
    return this.ycDatasetsService.getStatus();
  }

  @Post('update')
  @ApiOperation({ summary: 'Оновити datasets з YouControl API' })
  updateDatasets() {
    return this.ycDatasetsService.updateDatasets();
  }
}
