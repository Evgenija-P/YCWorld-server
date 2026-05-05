import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export const YCW_BASE_URL =
  process.env.YC_API_URL ?? 'https://api.youcontrol.world';
const REQUEST_TIMEOUT = 15_000;

@Injectable()
export class YcwHttpService {
  private readonly logger = new Logger(YcwHttpService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  async getApiKey(): Promise<string> {
    const settings = await this.settingsService.getApiKey();
    const key = settings?.apiKey ?? process.env.YC_API_KEY;

    if (!key) {
      throw new UnauthorizedException(
        'API-ключ YouControl не налаштовано. Зверніться до адміністратора.',
      );
    }

    return key;
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const apiKey = await this.getApiKey();

    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${YCW_BASE_URL}${path}`, {
          headers: {
            'X-API-KEY': apiKey,
            Accept: 'text/plain',
          },
          params,
          timeout: REQUEST_TIMEOUT,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error, path);
    }
  }

  private handleError(error: unknown, path: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message =
        (error.response?.data as Record<string, unknown>)?.message ??
        error.message;

      this.logger.error(
        `YCW API [${path}]: ${status} — ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );

      if (status === 401 || status === 403) {
        throw new UnauthorizedException(
          'Невірний або прострочений API-ключ YouControl.',
        );
      }
      if (status === 404) {
        throw new InternalServerErrorException(
          'Сутність не знайдена в YouControl API.',
        );
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableException(
          'YouControl API не відповідає (timeout).',
        );
      }

      throw new ServiceUnavailableException(
        `YouControl API повернув помилку: ${status ?? 'невідомо'}`,
      );
    }

    this.logger.error(`Unexpected error [${path}]:`, error);
    throw new InternalServerErrorException(
      'Невідома помилка при запиті до YouControl API.',
    );
  }
}
