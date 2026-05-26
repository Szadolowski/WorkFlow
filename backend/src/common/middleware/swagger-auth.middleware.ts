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

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return this.sendChallenge(res);
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'utf-8',
      );
      const [email, password] = credentials.split(':');

      if (!email || !password) {
        return this.sendChallenge(res);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { email },
      });

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
