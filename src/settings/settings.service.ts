import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(Settings.name)
    private settingsModel: Model<SettingsDocument>,
  ) {}

  async onModuleInit() {
    const exists = await this.settingsModel.findOne();

    if (!exists) {
      await this.settingsModel.create({ apiKey: null });
    }
  }

  async setApiKey(apiKey: string) {
    return this.settingsModel.findOneAndUpdate(
      {},
      { apiKey },
      { returnDocument: 'after' },
    );
  }

  async getApiKey() {
    const settings = await this.settingsModel.findOne();

    if (!settings) {
      return this.settingsModel.create({ apiKey: null });
    }

    return settings;
  }
}
