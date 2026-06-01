import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // Do weryfikacji zahaszowanego hasła

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  // Wstrzykujemy PrismaService przez konstruktor - NestJS sam o to zadba!
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // 1. Sprawdzamy, czy przeglądarka wysłała nagłówek Basic Auth
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return this.sendChallenge(res);
    }

    try {
      // 2. Dekodujemy base64 (format login:haslo)
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'utf-8',
      );
      const [email, password] = credentials.split(':');

      if (!email || !password) {
        return this.sendChallenge(res);
      }

      // 3. SZUKAMY UŻYTKOWNIKA W BAZIE DANYCH
      // Zapytanie do tabeli employee, szukając po unikalnym emailu
      const employee = await this.prisma.employee.findUnique({
        where: { email },
      });

      // 4. WERYFIKACJA UPRAWNIEŃ I HASŁA
      // - Sprawdzamy czy pracownik istnieje
      // - Sprawdzamy czy jego rola to ADMIN (UserRole.ADMIN)
      // - Sprawdzamy czy konto jest aktywne (isActive === true)
      // - Porównujemy hasło z bazy z wpisanym za pomocą: await bcrypt.compare(password, employee.passwordHash)
      if (
        !employee ||
        employee.role !== UserRole.ADMIN ||
        !employee.isActive ||
        !employee.passwordHash ||
        !(await bcrypt.compare(password, employee.passwordHash))
      ) {
        return this.sendChallenge(res);
      }

      // Jeśli wszystkie warunki są spełnione, wpuszczamy użytkownika do Swaggera
      next();
    } catch {
      return this.sendChallenge(res);
    }
  }

  // Pomocnicza funkcja wymuszająca na przeglądarce pokazanie systemowego okienka logowania
  private sendChallenge(res: Response) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="Swagger API Docs", charset="UTF-8"',
    );
    res.status(401).send('Unauthorized');
  }
}
