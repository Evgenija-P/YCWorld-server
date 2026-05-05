import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';

type YcCountriesResponse = {
  statusCode: number;
  result: Record<string, string>;
};

export type CountryDoc = {
  countries: { code: string; name: string }[];
  updatedAt: Date;
};

@Injectable()
export class YcCountriesService implements OnModuleInit {
  private readonly baseUrl = process.env.YC_API_URL;

  constructor(
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    @InjectModel('CountryCache')
    private readonly countryModel: Model<CountryDoc>,
  ) {}

  // ===== INIT =====

  async onModuleInit() {
    const cached = await this.countryModel.findOne();

    if (!cached || !cached.countries?.length) {
      console.warn('Countries not initialized');
      return;
    }

    console.log(
      `Countries loaded. Updated at: ${cached.updatedAt?.toISOString()}. Expired: ${this.isExpired(
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

  // ===== GET COUNTRIES (ONLY FROM DB) =====

  async getCountries() {
    const cached = await this.countryModel.findOne();

    if (!cached || !cached.countries?.length) {
      return {
        countries: [],
        status: 'empty',
        updatedAt: null,
      };
    }

    return {
      countries: cached.countries,
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
    };
  }

  // ===== UPDATE (ONLY BY USER ACTION) =====

  async updateCountries() {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      throw new InternalServerErrorException('API key is missing');
    }

    const data = await this.fetchFromApi(apiKey);
    const countries = this.normalizeCountries(data);

    const existing = await this.countryModel.findOne();

    if (existing) {
      existing.countries = countries;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      await this.countryModel.create({
        countries,
        updatedAt: new Date(),
      });
    }

    console.log('Countries updated successfully', existing);

    return {
      success: true,
      updatedAt: new Date(),
    };
  }

  // ===== FETCH =====

  private async fetchFromApi(apiKey: string): Promise<unknown> {
    const { data } = await this.http.axiosRef.get<YcCountriesResponse>(
      `${this.baseUrl}/Country`,
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

  // ===== TTL =====

  private isExpired(date: Date) {
    const TTL = 25 * 24 * 60 * 60 * 1000; // 25 днів
    return Date.now() - new Date(date).getTime() > TTL;
  }

  // ===== STATUS =====

  async getStatus() {
    const cached = await this.countryModel.findOne();

    if (!cached || !cached.countries?.length) {
      return {
        status: 'empty',
        updatedAt: null,
      };
    }

    return {
      status: this.isExpired(cached.updatedAt) ? 'expired' : 'valid',
      updatedAt: cached.updatedAt,
    };
  }
}
