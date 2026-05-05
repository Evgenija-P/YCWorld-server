import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { YcwModule } from './ycw/ycw.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Створимо його нижче
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { SettingsModule } from './settings/settings.module';
import { YcCountriesModule } from './ycw/yc-countries/yc-countries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    YcwModule,
    AuthModule,
    UsersModule,
    CompanyModule,
    SettingsModule,
    YcCountriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
