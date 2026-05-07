import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { YcSchemasService } from './yc-schemas.service';

@ApiTags('YC Schemas')
@ApiBearerAuth('JWT-auth')
@Controller('yc/schemas')
export class YcSchemasController {
  constructor(private readonly ycSchemasService: YcSchemasService) {}

  // ===== GET SCHEMAS =====

  @Get()
  @ApiOperation({
    summary: 'Отримати schemas з кешу БД',
  })
  getSchemas() {
    return this.ycSchemasService.getSchemas();
  }

  // ===== STATUS =====

  @Get('status')
  @ApiOperation({
    summary: 'Отримати статус кешу schemas',
  })
  getStatus() {
    return this.ycSchemasService.getStatus();
  }

  // ===== UPDATE =====

  @Post('update')
  @ApiOperation({
    summary: 'Оновити schemas з YouControl API та зберегти у БД',
  })
  updateSchemas() {
    return this.ycSchemasService.updateSchemas();
  }
}
