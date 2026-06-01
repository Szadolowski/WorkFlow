import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Płace i Raporty (Payroll)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('export-excel')
  @ApiOperation({ summary: 'Generuje listę płac w XLSX' })
  async exportExcel(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('facilityId') facilityId: string,
    @Res() res: Response,
  ) {
    await this.payrollService.generateExcelExport(
      parseInt(month, 10),
      parseInt(year, 10),
      facilityId,
      res,
    );
  }
}
