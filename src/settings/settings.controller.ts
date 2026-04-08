import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SetApiKeyDto } from './dto/api-keys.dto';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('api-key')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Зберегти API ключ' })
  @ApiBody({ type: SetApiKeyDto })
  async setApiKey(@Body() dto: SetApiKeyDto) {
    return this.settingsService.setApiKey(dto.apiKey);
  }

  @Get('api-key')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Отримати API ключ' })
  async getApiKey() {
    return this.settingsService.getApiKey();
  }

  @Get('api-key-status')
  @ApiOperation({ summary: 'Перевірити наявність API ключа' })
  async getApiKeyStatus() {
    const settings = await this.settingsService.getApiKey();

    return {
      exists: !!settings?.apiKey,
    };
  }
}
