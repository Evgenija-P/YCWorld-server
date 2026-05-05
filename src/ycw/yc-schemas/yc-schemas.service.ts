import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { YcwHttpService } from '../ycw-http.service';
import { YcSchemasDocument } from './yc-schemas.schema';

const TTL_MS = 25 * 24 * 60 * 60 * 1000;

@Injectable()
export class YcSchemasService implements OnModuleInit {
  constructor(
    private readonly ycwHttp: YcwHttpService,
    @InjectModel('YcSchemasCache')
    private readonly model: Model<YcSchemasDocument>,
  ) {}

  async onModuleInit() {
    const cached = await this.model.findOne();
    if (!cached?.schemas?.length) {
      console.warn(
        '[YcSchemas] Cache is empty. Use POST /yc/schemas/update to populate.',
      );
      return;
    }
    console.log(
      `[YcSchemas] Loaded. Updated: ${cached.updatedAt?.toISOString()}. Expired: ${this.isExpired(cached.updatedAt)}`,
    );
  }

  async getSchemas() {
    const cached = await this.model.findOne();
    if (!cached?.schemas?.length) {
      return { schemas: [], status: 'empty', updatedAt: null };
    }
    return {
      schemas: cached.schemas,
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
    };
  }

  async updateSchemas() {
    const raw = await this.ycwHttp.get<unknown>('/Schema');
    const schemas = this.normalizeSchemas(raw);

    const existing = await this.model.findOne();
    if (existing) {
      existing.schemas = schemas;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      await this.model.create({ schemas, updatedAt: new Date() });
    }

    return { success: true, count: schemas.length, updatedAt: new Date() };
  }

  async getStatus() {
    const cached = await this.model.findOne();
    if (!cached?.schemas?.length) return { status: 'empty', updatedAt: null };
    return {
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
      count: cached.schemas.length,
    };
  }

  private normalizeSchemas(
    raw: unknown,
  ): { name: string; type: string | null }[] {
    if (typeof raw !== 'object' || raw === null) return [];
    const result = (raw as Record<string, unknown>).result;
    if (!Array.isArray(result)) return [];
    return result
      .filter(
        (s): s is Record<string, unknown> =>
          typeof s === 'object' && s !== null,
      )
      .map((s) => ({
        name: typeof s.name === 'string' ? s.name : '',
        type: typeof s.type === 'string' ? s.type : null,
      }));
  }

  private isExpired(date: Date): boolean {
    return Date.now() - new Date(date).getTime() > TTL_MS;
  }
}
