import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { HttpService } from '@nestjs/axios';

import { SettingsService } from '../../settings/settings.service';

import { DatasetItem, YcDatasetsDocument } from './yc-datasets.schema';

const TTL_MS = 25 * 24 * 60 * 60 * 1000;

type YcDatasetsResponse = {
  statusCode: number;

  result: {
    _id: string;

    name: string;

    title: string | null;

    description: string | null;

    countries: string[] | null;

    types: string[] | null;

    isPep: boolean | null;
  }[];
};

@Injectable()
export class YcDatasetsService implements OnModuleInit {
  private readonly baseUrl = process.env.YC_API_URL;

  constructor(
    private readonly http: HttpService,

    private readonly settingsService: SettingsService,

    @InjectModel('YcDatasetsCache')
    private readonly datasetsModel: Model<YcDatasetsDocument>,
  ) {}

  // ===== INIT =====

  async onModuleInit() {
    const cached = await this.datasetsModel.findOne();

    if (!cached || !cached.datasets?.length) {
      console.warn('Datasets not initialized');

      return;
    }

    console.log(
      `Datasets loaded. Updated at: ${cached.updatedAt?.toISOString()}. Expired: ${this.isExpired(
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

  // ===== GET DATASETS (ONLY FROM DB) =====

  async getDatasets() {
    const cached = await this.datasetsModel.findOne();

    if (!cached || !cached.datasets?.length) {
      return {
        datasets: [],

        status: 'empty',

        updatedAt: null,
      };
    }

    return {
      datasets: cached.datasets,

      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',

      updatedAt: cached.updatedAt,
    };
  }

  // ===== UPDATE (ONLY BY USER ACTION) =====

  async updateDatasets() {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      throw new InternalServerErrorException('API key is missing');
    }

    const data = await this.fetchFromApi(apiKey);

    const datasets = this.normalizeDatasets(data);

    const existing = await this.datasetsModel.findOne();

    if (existing) {
      existing.datasets = datasets;

      existing.updatedAt = new Date();

      await existing.save();
    } else {
      await this.datasetsModel.create({
        datasets,

        updatedAt: new Date(),
      });
    }

    console.log('Datasets updated successfully');

    return {
      success: true,

      updatedAt: new Date(),

      count: datasets.length,
    };
  }

  // ===== FETCH =====

  private async fetchFromApi(apiKey: string): Promise<unknown> {
    const { data } = await this.http.axiosRef.get<YcDatasetsResponse>(
      `${this.baseUrl}/DataSet`,
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

  private normalizeDatasets(data: unknown): DatasetItem[] {
    const result =
      typeof data === 'object' &&
      data !== null &&
      'result' in data &&
      Array.isArray((data as YcDatasetsResponse).result)
        ? (data as YcDatasetsResponse).result
        : [];

    return result
      .filter((item) => item?._id)

      .map((item) => ({
        value: item._id,

        label: item.title || item.name || item._id,

        description: item.description ?? null,

        countries: Array.isArray(item.countries) ? item.countries : [],

        types: Array.isArray(item.types) ? item.types : [],

        isPep: item.isPep ?? null,
      }))

      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // ===== TTL =====

  private isExpired(date: Date) {
    return Date.now() - new Date(date).getTime() > TTL_MS;
  }

  // ===== STATUS =====

  async getStatus() {
    const cached = await this.datasetsModel.findOne();

    if (!cached || !cached.datasets?.length) {
      return {
        status: 'empty',

        updatedAt: null,
      };
    }

    return {
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',

      updatedAt: cached.updatedAt,

      count: cached.datasets.length,
    };
  }
}
