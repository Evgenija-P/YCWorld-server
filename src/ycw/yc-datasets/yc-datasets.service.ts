import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { YcwHttpService } from '../ycw-http.service';
import { YcDatasetsDocument } from './yc-datasets.schema';

const TTL_MS = 25 * 24 * 60 * 60 * 1000;

@Injectable()
export class YcDatasetsService implements OnModuleInit {
  constructor(
    private readonly ycwHttp: YcwHttpService,
    @InjectModel('YcDatasetsCache')
    private readonly model: Model<YcDatasetsDocument>,
  ) {}

  async onModuleInit() {
    const cached = await this.model.findOne();
    if (!cached?.datasets?.length) {
      console.warn(
        '[YcDatasets] Cache is empty. Use POST /yc/datasets/update to populate.',
      );
      return;
    }
    console.log(
      `[YcDatasets] Loaded. Updated: ${cached.updatedAt?.toISOString()}. Expired: ${this.isExpired(cached.updatedAt)}`,
    );
  }

  async getDatasets() {
    const cached = await this.model.findOne();
    if (!cached?.datasets?.length) {
      return { datasets: [], status: 'empty', updatedAt: null };
    }
    return {
      datasets: cached.datasets,
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
    };
  }

  async updateDatasets() {
    const raw = await this.ycwHttp.get<unknown>('/DataSet');
    const datasets = this.normalizeDatasets(raw);

    const existing = await this.model.findOne();
    if (existing) {
      existing.datasets = datasets;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      await this.model.create({ datasets, updatedAt: new Date() });
    }

    return { success: true, count: datasets.length, updatedAt: new Date() };
  }

  async getStatus() {
    const cached = await this.model.findOne();
    if (!cached?.datasets?.length) return { status: 'empty', updatedAt: null };
    return {
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
      count: cached.datasets.length,
    };
  }

  private normalizeDatasets(raw: unknown): Record<string, unknown>[] {
    if (typeof raw !== 'object' || raw === null) return [];
    const result = (raw as Record<string, unknown>).result;
    if (!Array.isArray(result)) return [];

    return result
      .filter(
        (ds): ds is Record<string, unknown> =>
          typeof ds === 'object' && ds !== null,
      )
      .map((ds) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _key, _rev, _from, _to, uids, ...rest } = ds;
        return rest;
      });
  }

  private isExpired(date: Date): boolean {
    return Date.now() - new Date(date).getTime() > TTL_MS;
  }
}
