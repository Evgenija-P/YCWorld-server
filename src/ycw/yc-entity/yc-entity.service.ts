import { Injectable } from '@nestjs/common';
import { YcwHttpService } from '../ycw-http.service';
import { YcwTransformer, TransformMode } from '../ycw.transformer';

@Injectable()
export class YcEntityService {
  constructor(private readonly ycwHttp: YcwHttpService) {}

  async getEntity(externalId: string, mode: TransformMode = 'duplicate') {
    const encoded = encodeURIComponent(externalId);
    const raw = await this.ycwHttp.get<unknown>(
      `/Entity/${encoded}/get-entity`,
    );
    return YcwTransformer.transformEntity(raw, mode);
  }
}
