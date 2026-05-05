import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { YcTraceService } from './yc-trace.service';

@ApiTags('YC Trace')
@ApiBearerAuth('JWT-auth')
@Controller('yc/trace')
export class YcTraceController {
  constructor(private readonly ycTraceService: YcTraceService) {}

  @Get(':entityId/risk-country')
  @ApiOperation({
    summary: 'Перевірка ризикових країн (до 3-го рівня зв\'язків)',
    description: 'Кожен виклик тарифікується окремо. entityId = поле _id з деталей сутності.',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Поле _id з відповіді /yc/entity/:externalId (напр. "Legal/19755000670")',
    example: 'Legal/19755000670',
  })
  getRiskCountryTrace(@Param('entityId') entityId: string) {
    return this.ycTraceService.getRiskCountryTrace(entityId);
  }

  @Get(':entityId/sanctions')
  @ApiOperation({
    summary: 'Перевірка санкцій (до 2-го рівня зв\'язків)',
    description: 'Кожен виклик тарифікується окремо.',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Поле _id з відповіді /yc/entity/:externalId',
    example: 'Legal/19755000670',
  })
  getSanctionsTrace(@Param('entityId') entityId: string) {
    return this.ycTraceService.getSanctionsTrace(entityId);
  }

  @Get(':entityId/pep')
  @ApiOperation({
    summary: 'Перевірка PEP (до 2-го рівня зв\'язків)',
    description: 'Кожен виклик тарифікується окремо.',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Поле _id з відповіді /yc/entity/:externalId',
    example: 'Legal/19755000670',
  })
  getPepTrace(@Param('entityId') entityId: string) {
    return this.ycTraceService.getPepTrace(entityId);
  }
}
