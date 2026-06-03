import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { TimeEntriesService } from './time-entries.service';
import { UpdateTimeEntryStatusDto } from './dto/update-time-entry-status.dto';

@ApiTags('Time Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Roles(UserRole.ADMIN, UserRole.FOREMAN)
  @Get('pending')
  @ApiOperation({
    summary: 'Pobiera oczekujące wpisy czasu pracy',
    description:
      'Zwraca wpisy TimeEntry ze statusem PENDING dla aktywnego zakładu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista oczekujących wpisów czasu pracy.',
  })
  @ApiResponse({
    status: 403,
    description: 'Brak dostępu do wybranego zakładu.',
  })
  findPending(
    @Query('facilityId') facilityId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timeEntriesService.findPending(facilityId, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.FOREMAN)
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Zatwierdza lub odrzuca wpis czasu pracy',
    description:
      'Pozwala zmienić status wpisu PENDING na APPROVED albo REJECTED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status wpisu czasu pracy został zmieniony.',
  })
  @ApiResponse({
    status: 400,
    description: 'Nieprawidłowy status lub próba zmiany wpisu nieoczekującego.',
  })
  @ApiResponse({
    status: 403,
    description: 'Brak dostępu do zakładu wpisu.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wpis czasu pracy nie istnieje.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timeEntriesService.updateStatus(id, dto, req.user);
  }
}
