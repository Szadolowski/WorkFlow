import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(
    @Request() req: AuthenticatedRequest,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.authService.getMe(req.user, facilityId);
  }
}
