import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // --- NOWY ZABEZPIECZONY ENDPOINT ---

  // 1. Podpinamy naszych dwóch strażników (kolejność ma znaczenie!)
  @UseGuards(JwtAuthGuard, RolesGuard)
  // 2. Wieszamy etykietę: "Tylko dla ADMINA"
  @Roles(UserRole.ADMIN)
  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    // 3. Zwracamy to, co nasz JwtAuthGuard odkodował z tokena i przykleił do zapytania
    return {
      message: 'Sukces! Drzwi zostały otwarte.',
      user: req.user,
    };
  }
}
