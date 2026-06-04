import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ContractType, UserRole } from '@prisma/client';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

interface PayrollRecord {
  firstName: string;
  lastName: string;
  pesel: string;
  role: string;
  contractType: ContractType | 'BRAK';
  salaryAmount: number;
  totalHours: number;
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  private calculateGrossPay(record: PayrollRecord) {
    if (record.contractType === ContractType.UOP) {
      return record.salaryAmount;
    }

    if (record.contractType === ContractType.UZ) {
      return record.salaryAmount * record.totalHours;
    }

    if (record.contractType === ContractType.B2B) {
      return record.salaryAmount * record.totalHours;
    }

    if (record.contractType === ContractType.UD) {
      return record.salaryAmount;
    }

    return 0;
  }

  async generateExcelExport(
    month: number,
    year: number,
    facilityId: string,
    user: JwtPayload,
    res: Response,
  ) {
    if (
      user.role !== UserRole.ADMIN &&
      !user.facilityIds.includes(facilityId)
    ) {
      throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        status: 'APPROVED',
        project: { facilityId },
        startTime: { gte: startDate, lt: endDate },
      },
      include: {
        employee: {
          include: {
            contracts: { where: { isCurrent: true } },
          },
        },
      },
    });

    if (timeEntries.length === 0) {
      throw new BadRequestException(
        `Brak zatwierdzonych godzin w zakładzie dla ${month}/${year}.`,
      );
    }

    // Używamy zdefiniowanego interfejsu
    const payrollData = new Map<string, PayrollRecord>();

    timeEntries.forEach((entry) => {
      const emp = entry.employee;
      if (!payrollData.has(emp.id)) {
        const currentContract = emp.contracts[0];
        payrollData.set(emp.id, {
          firstName: emp.firstName,
          lastName: emp.lastName,
          pesel: emp.pesel || 'Brak',
          role: emp.role,
          contractType: currentContract ? currentContract.type : 'BRAK',
          salaryAmount: currentContract
            ? Number(currentContract.salaryAmount)
            : 0,
          totalHours: 0,
        });
      }

      const record = payrollData.get(emp.id)!;
      record.totalHours += Number(entry.calculatedHours);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WorkFlow System';
    const sheet = workbook.addWorksheet(`Wypłaty ${month}-${year}`);

    sheet.columns = [
      { header: 'Imię', key: 'firstName', width: 15 },
      { header: 'Nazwisko', key: 'lastName', width: 20 },
      { header: 'PESEL', key: 'pesel', width: 15 },
      { header: 'Stanowisko', key: 'role', width: 15 },
      { header: 'Typ umowy', key: 'contractType', width: 15 },
      {
        header: 'Model rozliczenia',
        key: 'settlementModel',
        width: 22,
      },
      {
        header: 'Stawka / wynagrodzenie brutto',
        key: 'salaryAmount',
        width: 22,
        style: { numFmt: '#,##0.00 "zł"' },
      },
      {
        header: 'Przepracowane godziny',
        key: 'totalHours',
        width: 22,
        style: { numFmt: '0.00 "h"' },
      },
      {
        header: 'Kwota brutto (PLN)',
        key: 'totalPay',
        width: 22,
        style: { numFmt: '#,##0.00 "zł"', font: { bold: true } },
      },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    payrollData.forEach((data) => {
      sheet.addRow({
        firstName: data.firstName,
        lastName: data.lastName,
        pesel: data.pesel,
        role: data.role,
        contractType: data.contractType,
        salaryAmount: data.salaryAmount,
        totalHours: data.totalHours,
        totalPay: this.calculateGrossPay(data),
        settlementModel:
          data.contractType === ContractType.UOP
            ? 'Miesięcznie'
            : data.contractType === ContractType.UD
              ? 'Kwota za dzieło'
              : data.contractType === ContractType.UZ ||
                  data.contractType === ContractType.B2B
                ? 'Godzinowo'
                : 'Brak umowy',
      });
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Raport_Plac_${month}_${year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
