import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: JwtPayload, facilityIdParam?: string) {
    // Priorytet ma ID z paska nawigacji (query), fallback na domyślny zakład usera
    const facilityId = facilityIdParam || user.activeFacilityId;

    switch (user.role) {
      case UserRole.HR:
        return this.getHrSummary(facilityId);
      case UserRole.FOREMAN:
        return this.getForemanSummary(facilityId);
      default:
        // Fallback dla pozostałych ról (np. ADMIN, WORKER)
        return { role: user.role, data: {} };
    }
  }

  // --- LOGIKA DLA HR ---
  private async getHrSummary(facilityId: string) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    // 1. Teal/Mint (Sukces) - Aktywni pracownicy w danym zakładzie
    const activeEmployeesCount = await this.prisma.employee.count({
      where: { facilityId, isActive: true },
    });

    // 2. Neutralne - Aktywne umowy
    const activeContractsCount = await this.prisma.contract.count({
      where: { employee: { facilityId }, isCurrent: true },
    });

    // 3. Copper/Orange (Alert) - Wygasające BHP (<= 30 dni)
    const expiringCertsCount = await this.prisma.employeeCertification.count({
      where: {
        employee: { facilityId, isActive: true },
        expiresAt: { gte: now, lte: in30Days },
      },
    });

    // 4. Moduł Sprzętu
    const activeEquipmentCount = await this.prisma.equipmentAssignment.count({
      where: { employee: { facilityId }, returnedAt: null },
    });

    return {
      role: 'HR',
      data: {
        activeEmployeesCount,
        activeContractsCount,
        expiringCertsCount,
        activeEquipmentCount,
      },
    };
  }

  // --- LOGIKA DLA BRYGADZISTY ---
  private async getForemanSummary(facilityId: string) {
    // 1. Teal/Mint (Sukces) - Aktywne projekty przypisane do zakładu
    const activeProjectsCount = await this.prisma.project.count({
      where: { facilityId, status: 'ACTIVE' },
    });

    // 2. Neutralne - Pracownicy odbici na czytniku "dzisiaj"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const presentWorkers = await this.prisma.timeEvent.findMany({
      where: { reader: { facilityId }, eventTime: { gte: startOfDay } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });

    // 3. Copper/Orange (Alert) - Niezatwierdzone godziny (PENDING) z nowej tabeli
    const pendingTimeEntriesCount = await this.prisma.timeEntry.count({
      where: { project: { facilityId }, status: 'PENDING' },
    });

    // 4. Moduł Sprzętu
    const activeEquipmentCount = await this.prisma.equipmentAssignment.count({
      where: { employee: { facilityId }, returnedAt: null },
    });

    return {
      role: 'FOREMAN',
      data: {
        activeProjectsCount,
        presentWorkersCount: presentWorkers.length,
        pendingTimeEntriesCount,
        activeEquipmentCount,
      },
    };
  }
}
