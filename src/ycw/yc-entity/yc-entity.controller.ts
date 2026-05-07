import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { YcEntityService } from './yc-entity.service';

@ApiTags('YC Entity')
@ApiBearerAuth('JWT-auth')
@Controller('yc/entity')
export class YcEntityController {
  constructor(private readonly ycEntityService: YcEntityService) {}

  @Get(':externalId')
  @ApiOperation({
    summary: 'Детальна інформація про сутність',
    description: `
      Повертає повні дані по сутності з усіма зв'язками, згрупованими по типу.

      Параметр mode:
      - duplicate (default) — кожен датасет окремо, видно різницю між джерелами
      - merge — всі датасети злиті в один об'єкт, всі значення зібрані в масиви
    `,
  })
  @ApiParam({
    name: 'externalId',
    description: 'externalId з результатів /yc/search',
    example: 'TGVnYWw6Om9jLWNvbXBhbmllcy1tZC0xMDAzNjAwMDc5MjQ2',
  })
  async getEntity(
    @Param('externalId')
    externalId: string,
  ) {
    return await this.ycEntityService.getEntity(externalId);
  }
}
