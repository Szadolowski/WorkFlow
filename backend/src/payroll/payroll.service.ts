import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

// Definiujemy ścisły interfejs, żeby linter nie krzyczał o typ "any"
interface PayrollRecord {
  firstName: string;
  lastName: string;
  pesel: string;
  role: string;
  hourlyRate: number;
  totalHours: number;
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

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
          hourlyRate: currentContract
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
      {
        header: 'Stawka (PLN/h)',
        key: 'hourlyRate',
        width: 15,
        style: { numFmt: '#,##0.00 "zł"' },
      },
      {
        header: 'Przepracowane Godziny',
        key: 'totalHours',
        width: 25,
        style: { numFmt: '0.00 "h"' },
      },
      {
        header: 'Kwota Brutto (PLN)',
        key: 'totalPay',
        width: 25,
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
        hourlyRate: data.hourlyRate,
        totalHours: data.totalHours,
        totalPay: data.hourlyRate * data.totalHours,
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
