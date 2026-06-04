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
import { CertificationsService } from './certifications.service';
import { CreateCertificationDictionaryDto } from './dto/create-certification-dictionary.dto';
import { UpdateCertificationDictionaryDto } from './dto/update-certification-dictionary.dto';
import { CreateEmployeeCertificationDto } from './dto/create-employee-certification.dto';

@ApiTags('Certifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Get('certifications/dictionary')
  @ApiOperation({
    summary: 'Pobiera słownik szkoleń, badań i uprawnień',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista pozycji słownika.',
  })
  findDictionary() {
    return this.certificationsService.findDictionary();
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post('certifications/dictionary')
  @ApiOperation({
    summary: 'Dodaje pozycję do słownika certyfikacji',
  })
  createDictionary(@Body() dto: CreateCertificationDictionaryDto) {
    return this.certificationsService.createDictionary(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Patch('certifications/dictionary/:id')
  @ApiOperation({
    summary: 'Aktualizuje pozycję słownika certyfikacji',
  })
  updateDictionary(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCertificationDictionaryDto,
  ) {
    return this.certificationsService.updateDictionary(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Get('employees/:employeeId/certifications')
  @ApiOperation({
    summary: 'Pobiera certyfikaty pracownika',
  })
  findEmployeeCertifications(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.certificationsService.findEmployeeCertifications(
      employeeId,
      req.user,
      facilityId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post('employees/:employeeId/certifications')
  @ApiOperation({
    summary: 'Dodaje certyfikat, szkolenie lub badanie pracownikowi',
  })
  createEmployeeCertification(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: CreateEmployeeCertificationDto,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.certificationsService.createEmployeeCertification(
      employeeId,
      dto,
      req.user,
      facilityId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Get('certifications/expiring')
  @ApiOperation({
    summary: 'Pobiera certyfikaty wygasające w podanym zakresie dni',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista wygasających certyfikatów.',
  })
  findExpiringCertifications(
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
    @Query('days') days: string | undefined,
  ) {
    return this.certificationsService.findExpiringCertifications(
      req.user,
      facilityId,
      days,
    );
  }
}
