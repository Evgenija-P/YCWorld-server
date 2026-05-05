import { Injectable } from '@nestjs/common';
import { YcwHttpService } from '../ycw-http.service';
import { YcwTransformer } from '../ycw.transformer';

@Injectable()
export class YcTraceService {
  constructor(private readonly ycwHttp: YcwHttpService) {}

  private normalizeId(id: string): string {
    return id.replace(/\//g, '_');
  }

  async getRiskCountryTrace(entityId: string) {
    const id = this.normalizeId(entityId);
    const raw = await this.ycwHttp.get<unknown>(
      `/Trace/${id}/get-entity-trace`,
    );
    return YcwTransformer.transformTrace(raw);
  }

  async getSanctionsTrace(entityId: string) {
    const id = this.normalizeId(entityId);
    const raw = await this.ycwHttp.get<unknown>(
      `/Trace/${id}/get-entity-sanctions-trace`,
    );
    return YcwTransformer.transformTrace(raw);
  }

  async getPepTrace(entityId: string) {
    const id = this.normalizeId(entityId);
    const raw = await this.ycwHttp.get<unknown>(
      `/Trace/${id}/get-entity-pep-trace`,
    );
    return YcwTransformer.transformTrace(raw);
  }
}
