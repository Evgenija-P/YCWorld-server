import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Підключаємо парсер кук
  app.use(cookieParser());

  const reflector = app.get(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // 2. Глобальна валідація вхідних даних
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3. CORS (для локальної мережі)
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('rest'); // Додаємо глобальний префікс для всіх маршрутів

  // 4. Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('YCW Monitoring API')
    .setDescription('Система пошуку компаній')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', // обов’язково даємо ім’я схемі
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api-docs`);
}
void bootstrap();
