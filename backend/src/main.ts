// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Włączamy globalną walidację
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Usuwa pola, których nie ma w DTO
      forbidNonWhitelisted: true, // Rzuca błąd, jeśli ktoś prześle nadmiarowe pola
      transform: true, // Automatycznie mapuje typy (np. string -> number)
    }),
  );

  await app.listen(2000);
}
bootstrap().catch((err) => {
  console.error('Krytyczny błąd podczas startu aplikacji:', err);
  process.exit(1);
});
