import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Zgodnie ze specyfikacją: GET /api/v1/dashboard/summary (prefiks api/v1 mamy pewnie ustawiony globalnie)
  @Get('summary')
  async getSummary(
    @Request() req: AuthenticatedRequest,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.dashboardService.getSummary(req.user, facilityId);
  }
}
