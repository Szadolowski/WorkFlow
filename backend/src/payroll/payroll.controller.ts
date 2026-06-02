import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

import { Roles } from '@/auth/decorators/roles.decorator';
import {
  JwtAuthGuard,
  AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { PayrollService } from './payroll.service';
import { ExportPayrollQueryDto } from './dto/export-payroll-query.dto';

@ApiTags('Płace i Raporty (Payroll)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Roles(UserRole.ADMIN, UserRole.ACCOUNTING)
  @Get('export-excel')
  @ApiOperation({
    summary: 'Generuje listę płac w XLSX',
    description:
      'Eksportuje raport płacowy dla wskazanego zakładu i okresu. Dostępne tylko dla ADMIN i ACCOUNTING.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plik XLSX z listą płac.',
  })
  @ApiResponse({
    status: 403,
    description: 'Brak uprawnień do raportu płacowego lub zakładu.',
  })
  async exportExcel(
    @Query() query: ExportPayrollQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    await this.payrollService.generateExcelExport(
      query.month,
      query.year,
      query.facilityId,
      req.user,
      res,
    );
  }
}
