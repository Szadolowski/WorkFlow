import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  facilityIds: string[];
  activeFacilityId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Brak tokena dostępu');
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new UnauthorizedException('Brak konfiguracji JWT_SECRET');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtSecret,
      });

      const employee = await this.prisma.employee.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          role: true,
          isActive: true,
          isLoginEnabled: true,
        },
      });

      if (!employee || !employee.isActive || !employee.isLoginEnabled) {
        throw new UnauthorizedException('Konto użytkownika jest nieaktywne.');
      }

      request.user = {
        ...payload,
        role: employee.role,
      };
    } catch {
      throw new UnauthorizedException('Nieprawidłowy lub wygasły token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
