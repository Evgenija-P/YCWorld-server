import { Injectable } from '@nestjs/common';
import { YcwHttpService } from '../ycw-http.service';
import { YcwTransformer } from '../ycw.transformer';
import { SearchEntitiesDto } from '../search-entities.dto';

@Injectable()
export class YcSearchService {
  constructor(private readonly ycwHttp: YcwHttpService) {}

  async search(dto: SearchEntitiesDto) {
    const raw = await this.ycwHttp.get<unknown>('/GetEntities', {
      SearchString: dto.searchString,
      SchemaName: dto.schemaName,
      DataSetIds: dto.dataSetIds,
      Countries: dto.countries,
      PageSize: dto.pageSize,
      Offset: dto.offset,
      IsPep: dto.isPep,
    });

    return YcwTransformer.transformSearch(raw);
  }
}
