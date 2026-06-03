import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { HttpService } from '@nestjs/axios';

import { SettingsService } from '../../settings/settings.service';
import { YC_SCHEMA_LABELS } from '../../constants/yc-schema-labels';

type YcSchemasResponse = {
  statusCode: number;
  result: {
    name: string;
    type: string | null;
    label: string | null;
  }[];
};

export type SchemaItem = {
  value: string;
  label: string;
  type: string | null;
};
export type SchemaDoc = {
  schemas: SchemaItem[];
  updatedAt: Date;
};

@Injectable()
export class YcSchemasService implements OnModuleInit {
  private readonly baseUrl = process.env.YC_API_URL;

  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,

    @InjectModel('YcSchemasCache')
    private readonly schemasModel: Model<SchemaDoc>,
  ) {}

  // ===== INIT =====

  async onModuleInit() {
    const cached = await this.schemasModel.findOne();

    if (!cached || !cached.schemas?.length) {
      console.warn('Schemas not initialized');
      return;
    }

    console.log(
      `Schemas loaded. Updated at: ${cached.updatedAt?.toISOString()}. Expired: ${this.isExpired(
        cached.updatedAt,
      )}`,
    );
  }

  // ===== API KEY =====

  private async getApiKey(): Promise<string | null> {
    const settings = await this.settingsService.getApiKey();

    if (settings?.apiKey) {
      return settings.apiKey;
    }

    return process.env.YC_API_KEY ?? null;
  }

  // ===== GET SCHEMAS (ONLY FROM DB) =====

  async getSchemas() {
    const cached = await this.schemasModel.findOne();

    if (!cached || !cached.schemas?.length) {
      return {
        schemas: [],
        status: 'empty',
        updatedAt: null,
      };
    }

    return {
      schemas: cached.schemas,
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
    };
  }

  // ===== UPDATE (ONLY BY USER ACTION) =====

  async updateSchemas() {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      throw new InternalServerErrorException('API key is missing');
    }

    const data = await this.fetchFromApi(apiKey);
    const schemas = this.normalizeSchemas(data);

    const existing = await this.schemasModel.findOne();

    if (existing) {
      existing.schemas = schemas;
      existing.updatedAt = new Date();

      await existing.save();
    } else {
      await this.schemasModel.create({
        schemas,
        updatedAt: new Date(),
      });
    }

    return {
      success: true,
      updatedAt: new Date(),
      count: schemas.length,
    };
  }

  // ===== FETCH =====

  private async fetchFromApi(apiKey: string): Promise<unknown> {
    const { data } = await this.http.axiosRef.get<YcSchemasResponse>(
      `${this.baseUrl}/Schema`,
      {
        headers: {
          'X-API-KEY': apiKey,
          Accept: 'text/plain',
        },
      },
    );

    return data;
  }

  // ===== NORMALIZE =====

  private normalizeSchemas(data: unknown): SchemaItem[] {
    const result =
      typeof data === 'object' &&
      data !== null &&
      'result' in data &&
      Array.isArray((data as YcSchemasResponse).result)
        ? (data as YcSchemasResponse).result
        : [];

    return result
      .filter((item) => item?.name)
      .map((item) => ({
        value: item.name,
        label: YC_SCHEMA_LABELS[item.name] ?? item.name,
        type: item.type,
      }));
  }

  // ===== TTL =====

  private isExpired(date: Date) {
    const TTL = 25 * 24 * 60 * 60 * 1000; // 25 днів

    return Date.now() - new Date(date).getTime() > TTL;
  }

  // ===== STATUS =====

  async getStatus() {
    const cached = await this.schemasModel.findOne();

    if (!cached || !cached.schemas?.length) {
      return {
        status: 'empty',
        updatedAt: null,
      };
    }

    return {
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
      count: cached.schemas.length,
    };
  }
}
