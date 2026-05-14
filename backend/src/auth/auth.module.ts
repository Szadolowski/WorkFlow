import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { PrismaService } from '@/prisma/prisma.service'; // Jeśli nie masz osobnego PrismaModule

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-super-secret-key', // Zmień w produkcji!
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
