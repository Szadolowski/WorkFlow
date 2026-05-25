import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import basicAuth from 'express-basic-auth';
import { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prisma = app.get(PrismaService);

  // 1. Definicja strażnika logowania (weryfikacja w bazie danych)
  const authMiddleware = basicAuth({
    challenge: true,
    authorizeAsync: true,
    authorizer: (username, password, cb) => {
      void (async () => {
        try {
          const employee = await prisma.employee.findUnique({
            where: { email: username },
          });

          if (
            !employee ||
            employee.role !== UserRole.ADMIN ||
            !employee.isActive ||
            !employee.passwordHash
          ) {
            cb(null, false);
            return;
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            employee.passwordHash,
          );
          cb(null, isPasswordValid);
        } catch {
          cb(null, false); // Bezpieczne odrzucenie w razie błędu bazy
        }
      })();
    },
  });

  // 2. Inteligentny router zabezpieczający CAŁY ekosystem Swaggera
  // Montujemy middleware na '/api', co oznacza, że przechwyci wszystko co uderza w /api/*
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Ponieważ jesteśmy zamontowani w '/api', zmienna req.path to ucięta reszta adresu.
    // Jeśli klient uderza w "/api/v1/employees", req.path wynosi "/v1/employees".
    // Musimy przepuścić ten ruch na wskroś bez pytania o hasło (logowanie JWT obsłuży to dalej).
    if (req.path.startsWith('/v1')) {
      next();
      return;
    }

    // Jeśli zapytanie nie zaczyna się od /v1 (np. pliki CSS, HTML, pliki JSON Swaggera),
    // bezwzględnie odpalamy ekran logowania!
    return authMiddleware(req, res, next);
  });

  // 3. Konfiguracja struktury dokumentacji
  const config = new DocumentBuilder()
    .setTitle('WorkFlow API')
    .setDescription('Dokumentacja interfejsów API dla systemu WorkFlow')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 4. KRYTYCZNA POPRAWKA: Przesuwamy ukryte pliki Swaggera do wnętrza ścieżki '/api'
  // Dzięki temu przeglądarka sama dołączy hasło do pobierania tych plików!
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/json',
    yamlDocumentUrl: 'api/yaml',
  });

  // 5. Globalna walidacja DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(2000);
}

bootstrap().catch((err) => {
  console.error('Krytyczny błąd podczas startu aplikacji:', err);
  process.exit(1);
});
