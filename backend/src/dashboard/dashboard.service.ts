import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private resolveFacilityIdForScopedUser(
    user: JwtPayload,
    facilityIdParam?: string,
  ) {
    const facilityId = facilityIdParam || user.activeFacilityId;

    if (!facilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    if (!user.facilityIds?.includes(facilityId)) {
      throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
    }

    return facilityId;
  }

  async getSummary(user: JwtPayload, facilityIdParam?: string) {
    if (user.role === UserRole.ADMIN) {
      return this.getAdminSummary();
    }

    const facilityId = this.resolveFacilityIdForScopedUser(
      user,
      facilityIdParam,
    );

    switch (user.role) {
      case UserRole.HR:
        return this.getHrSummary(facilityId);
      case UserRole.FOREMAN:
        return this.getForemanSummary(facilityId);
      case UserRole.ACCOUNTING:
        return this.getAccountingSummary(facilityId);
      default:
        return { role: user.role, data: {} };
    }
  }

  // ==========================================
  // LOGIKA DLA HR
  // ==========================================
  private async getHrSummary(facilityId: string) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const activeEmployeesCount = await this.prisma.employee.count({
      where: { facilityId, isActive: true },
    });

    const activeContractsCount = await this.prisma.contract.count({
      where: { employee: { facilityId }, isCurrent: true },
    });

    const expiringCertsCount = await this.prisma.employeeCertification.count({
      where: {
        employee: { facilityId, isActive: true },
        expiresAt: { gte: now, lte: in30Days },
      },
    });

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

  // ==========================================
  // LOGIKA DLA BRYGADZISTY
  // ==========================================
  private async getForemanSummary(facilityId: string) {
    const activeProjectsCount = await this.prisma.project.count({
      where: { facilityId, status: 'ACTIVE' },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const presentWorkers = await this.prisma.timeEvent.findMany({
      where: { reader: { facilityId }, eventTime: { gte: startOfDay } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });

    const pendingTimeEntriesCount = await this.prisma.timeEntry.count({
      where: { project: { facilityId }, status: 'PENDING' },
    });

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

  // ==========================================
  // LOGIKA DLA KSIĘGOWOŚCI
  // ==========================================
  private async getAccountingSummary(facilityId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pendingTimeEntriesCount = await this.prisma.timeEntry.count({
      where: { project: { facilityId }, status: 'PENDING' },
    });

    const approvedTimeEntries = await this.prisma.timeEntry.findMany({
      where: {
        project: { facilityId },
        status: 'APPROVED',
        startTime: { gte: firstDayOfMonth },
      },
      select: {
        calculatedHours: true,
      },
    });

    const approvedTimeEntriesCount = approvedTimeEntries.length;

    const approvedHoursThisMonth = approvedTimeEntries.reduce(
      (sum, entry) => sum + Number(entry.calculatedHours),
      0,
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentEntries = await this.prisma.timeEntry.findMany({
      where: {
        project: { facilityId },
        status: 'APPROVED',
        startTime: { gte: sevenDaysAgo },
      },
      select: { startTime: true, calculatedHours: true },
    });

    const weeklyChartData = this.aggregateHoursByDay(
      recentEntries,
      sevenDaysAgo,
    );

    return {
      role: 'ACCOUNTING',
      data: {
        pendingTimeEntriesCount,
        approvedTimeEntriesCount,
        approvedHoursThisMonth,
        currentMonthStart: firstDayOfMonth.toISOString(),
        currentMonthEnd: now.toISOString(),
        weeklyChartData,
      },
    };
  }

  // ==========================================
  // LOGIKA DLA ADMINA
  // ==========================================
  private async getAdminSummary() {
    // Helikopterowy widok (brak filtrowania po facilityId!)
    const totalFacilitiesCount = await this.prisma.facility.count({
      where: { isActive: true },
    });
    const totalEmployeesCount = await this.prisma.employee.count({
      where: { isActive: true },
    });
    const totalProjectsCount = await this.prisma.project.count({
      where: { status: 'ACTIVE' },
    });

    // Ostatnie logi (Audit Trail) z załączonymi danymi autora
    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return {
      role: 'ADMIN',
      data: {
        totalFacilitiesCount,
        totalEmployeesCount,
        totalProjectsCount,
        recentAuditLogs,
      },
    };
  }

  // ==========================================
  // HELPERY
  // ==========================================
  private aggregateHoursByDay(
    entries: { startTime: Date; calculatedHours: any }[],
    startDate: Date,
  ) {
    const days: { name: string; hours: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const dateString = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const shortDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      const sum = entries
        .filter((e) => e.startTime.toISOString().split('T')[0] === dateString)
        .reduce((acc, curr) => acc + Number(curr.calculatedHours), 0);

      days.push({ name: shortDate, hours: sum });
    }
    return days;
  }
}
