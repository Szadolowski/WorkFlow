import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceApprovalDto } from './dto/update-absence-approval.dto';

@ApiTags('Absences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Get('employees/:employeeId/absences')
  @ApiOperation({
    summary: 'Pobiera nieobecności pracownika',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista nieobecności pracownika.',
  })
  findByEmployee(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.absencesService.findByEmployee(
      employeeId,
      req.user,
      facilityId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post('employees/:employeeId/absences')
  @ApiOperation({
    summary: 'Dodaje nieobecność pracownikowi',
  })
  @ApiResponse({
    status: 201,
    description: 'Nieobecność została dodana.',
  })
  create(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: CreateAbsenceDto,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.absencesService.create(employeeId, dto, req.user, facilityId);
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Patch('absences/:id/approval')
  @ApiOperation({
    summary: 'Aktualizuje zatwierdzenie nieobecności',
  })
  @ApiResponse({
    status: 200,
    description: 'Status zatwierdzenia został zaktualizowany.',
  })
  updateApproval(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAbsenceApprovalDto,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.absencesService.updateApproval(
      id,
      dto.isApproved,
      req.user,
      facilityId,
    );
  }
}
