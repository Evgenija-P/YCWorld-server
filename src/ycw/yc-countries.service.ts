import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';
import { SettingsService } from '../settings/settings.service';

type YcCountriesResponse = {
  statusCode: number;
  result: Record<string, string>;
};

// тип документа
export type CountryDoc = {
  countries: { code: string; name: string }[];
  updatedAt: Date;
};

@Injectable()
export class YcCountriesService {
  private readonly baseUrl = process.env.YC_API_URL;
  private readonly apiKey = process.env.YC_API_KEY;
  private readonly useMock = process.env.YC_USE_MOCK === 'true';

  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    @InjectModel('CountryCache')
    private readonly countryModel: Model<CountryDoc>,
  ) {}

  private async getApiKey(): Promise<string | null> {
    const settings = await this.settingsService.getApiKey();

    if (settings?.apiKey) {
      return settings.apiKey;
    }

    return process.env.YC_API_KEY ?? null;
  }

  async getCountries() {
    const cached = await this.countryModel.findOne();

    if (cached && !this.isExpired(cached.updatedAt)) {
      return cached.countries;
    }

    let data: unknown;
    console.log(process.env.YC_USE_MOCK);
    console.log(`Fetching countries from ${this.useMock ? 'mock' : 'API'}...`);
    try {
      if (this.useMock) {
        data = this.loadMockCountries();
      } else {
        data = await this.fetchFromApi();
      }

      const countries = this.normalizeCountries(data);

      if (cached) {
        cached.countries = countries;
        cached.updatedAt = new Date();
        await cached.save();
      } else {
        await this.countryModel.create({
          countries,
          updatedAt: new Date(),
        });
      }

      return countries;
    } catch {
      throw new InternalServerErrorException('Failed to fetch countries');
    }
  }

  private async fetchFromApi(): Promise<unknown> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      throw new InternalServerErrorException('API key is missing');
    }

    const { data } = await this.http.axiosRef.get<YcCountriesResponse>(
      `${this.baseUrl}/Country`,
      {
        headers: {
          'X-API-KEY': apiKey,
          Accept: 'text/plain',
        },
      },
    );

    console.log('Raw API response:', data);
    return data;
  }

  private loadMockCountries(): unknown {
    const filePath = path.join(process.cwd(), 'src/mocks/countries.json');

    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  private normalizeCountries(data: unknown) {
    const result =
      typeof data === 'object' && data !== null && 'result' in data
        ? (data as { result: Record<string, string> }).result
        : {};

    return Object.entries(result).map(([code, name]) => ({
      code,
      name,
    }));
  }

  private isExpired(date: Date) {
    const TTL = 24 * 60 * 60 * 1000;
    return Date.now() - new Date(date).getTime() > TTL;
  }

  async hasCountries() {
    const doc = await this.countryModel.findOne();
    return { exists: !!doc?.countries?.length };
  }
}
