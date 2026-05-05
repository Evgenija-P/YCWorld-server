import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '../settings/settings.module';
import { YcwHttpService } from './ycw-http.service';

/**
 * @Global — YcwHttpService доступний у всіх дочірніх модулях
 * без потреби імпортувати його явно в кожному модулі.
 */
@Global()
@Module({
  imports: [HttpModule, SettingsModule],
  providers: [YcwHttpService],
  exports: [YcwHttpService],
})
export class YcwCoreModule {}
