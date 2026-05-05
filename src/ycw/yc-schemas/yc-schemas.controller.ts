import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { YcSchemasService } from './yc-schemas.service';

@ApiTags('YC Schemas')
@ApiBearerAuth('JWT-auth')
@Controller('yc/schemas')
export class YcSchemasController {
  constructor(private readonly ycSchemasService: YcSchemasService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список типів сутностей (з кешу БД)' })
  getSchemas() {
    return this.ycSchemasService.getSchemas();
  }

  @Get('status')
  @ApiOperation({ summary: 'Статус кешу schemas' })
  getStatus() {
    return this.ycSchemasService.getStatus();
  }

  @Post('update')
  @ApiOperation({ summary: 'Оновити schemas з YouControl API' })
  updateSchemas() {
    return this.ycSchemasService.updateSchemas();
  }
}
