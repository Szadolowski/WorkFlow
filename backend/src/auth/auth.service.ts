import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from '@/auth/dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    // Zabezpieczenie: Odwracamy żądanie jeśli user nie istnieje
    // LUB jeśli nie ma ustawionego hasła (passwordHash jest null)
    if (!employee || !employee.passwordHash) {
      throw new UnauthorizedException('Błędne poświadczenia');
    }

    if (!employee.isActive || !employee.isLoginEnabled) {
      throw new UnauthorizedException(
        'Konto nieaktywne lub brak dostępu do logowania',
      );
    }

    // TypeScript teraz wie, że employee.passwordHash na 100% jest stringiem
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      employee.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Błędne poświadczenia');
    }

    const payload = { sub: employee.id, role: employee.role };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
