import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { YcSearchService } from './yc-search.service';
import { SearchEntitiesDto } from './dto/search-entities.dto';

@ApiTags('YC Search')
@ApiBearerAuth('JWT-auth')
@Controller('yc/search')
export class YcSearchController {
  constructor(private readonly ycSearchService: YcSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Пошук сутностей',
    description: 'Пошук компаній, осіб, санкцій тощо. Повертає структуровані результати + агрегації у двох форматах (raw та grouped).',
  })
  search(@Query() dto: SearchEntitiesDto) {
    return this.ycSearchService.search(dto);
  }
}
