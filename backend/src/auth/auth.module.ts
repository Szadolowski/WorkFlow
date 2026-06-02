import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
          throw new Error('Brak wymaganej zmiennej środowiskowej JWT_SECRET');
        }

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '8h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [JwtModule],
})
export class AuthModule {}
