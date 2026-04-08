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
    origin: [
      'http://localhost:3000',
      'http://localhost:4000',
      'https://ycwmonitor.netlify.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('rest'); // Додаємо глобальний префікс для всіх маршрутів

  // 4. Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('YCW Monitoring API')
    .setDescription(
      `
Документація REST API для системи керування користувачами та компаніями YCWorld

🚀 **Як працювати із захищеними маршрутами**:

1️⃣ Використайте ендпоінт \`/auth/login\` для авторизації.  
2️⃣ 📋 Скопіюйте значення **accessToken** із відповіді (без "Bearer ").  
3️⃣ 🔒 Натисніть кнопку **"Authorize"** у Swagger (у верхній частині сторінки).  
4️⃣ Вставте токен у форматі:
   \`Bearer ваш_accessToken\`  
5️⃣ Натисніть **"Authorize"** → **"Close"**.  
6️⃣ ✅ Після цього всі захищені ендпоінти будуть доступні.

---

🔐 **Ролі у системі**:

- **SUPERADMIN** — повний доступ до системи (всі компанії, всі користувачі, налаштування)
- **ADMIN** — доступ тільки до користувачів своєї компанії
- **USER / VIEWER** — обмежений доступ (залежить від бізнес-логіки)

---

👥 **Робота з користувачами**:

- SUPERADMIN може переглядати всіх користувачів
- ADMIN — тільки користувачів своєї компанії
- Створення та редагування доступне ADMIN і SUPERADMIN
- Зміна паролю:
  - користувач змінює свій пароль через \`/auth/change-password\`
  - SUPERADMIN може скинути пароль будь-якому користувачу

---

🏢 **Компанії**:

- Створення, перегляд і видалення компаній доступне тільки SUPERADMIN
- Root-компанію видалити не можна

---

⚙️ **Налаштування**:

- API ключ задається через \`/settings/api-key\`
- Доступ має тільки SUPERADMIN
- Статус ключа доступний для перевірки

---

⚠️ **Увага**:

- При оновленні сторінки Swagger авторизація може скинутись  
- Якщо замок 🔓 відкритий — потрібно повторно авторизуватись  
- Усі перевірки прав виконуються на бекенді — не довіряйте лише фронту
`,
    )
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
