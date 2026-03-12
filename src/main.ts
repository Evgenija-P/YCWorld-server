import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Підключаємо парсер кук
  app.use(cookieParser());

  // 2. Глобальна валідація вхідних даних
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3. Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('Company Checker API')
    .setDescription('Система пошуку компаній та керування користувачами')
    .setVersion('1.0')
    .addBearerAuth() // Для тестування JWT через Swagger, якщо знадобиться
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4. CORS (для локальної мережі)
  app.enableCors({
    origin: 'http://localhost:3000', // Адреса вашого Next.js
    credentials: true,
  });

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
void bootstrap();
