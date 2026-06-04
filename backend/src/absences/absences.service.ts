import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { CreateAbsenceDto } from './dto/create-absence.dto';

@Injectable()
export class AbsencesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanManageEmployeeAbsences(
    employeeId: string,
    user: JwtPayload,
    facilityId?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        facilityId: true,
        isActive: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie istnieje lub jest nieaktywny.',
      );
    }

    if (user.role === UserRole.ADMIN) {
      return employee;
    }

    if (user.role !== UserRole.HR) {
      throw new ForbiddenException(
        'Brak uprawnień do zarządzania nieobecnościami.',
      );
    }

    const scopedFacilityId = facilityId || user.activeFacilityId;

    if (!scopedFacilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    if (!user.facilityIds?.includes(scopedFacilityId)) {
      throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
    }

    const hasAccess = await this.prisma.employeeFacilityAccess.findUnique({
      where: {
        employeeId_facilityId: {
          employeeId,
          facilityId: scopedFacilityId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!hasAccess && employee.facilityId !== scopedFacilityId) {
      throw new ForbiddenException('Brak dostępu do pracownika.');
    }

    return employee;
  }

  async findByEmployee(
    employeeId: string,
    user: JwtPayload,
    facilityId?: string,
  ) {
    await this.assertCanManageEmployeeAbsences(employeeId, user, facilityId);

    const absences = await this.prisma.absence.findMany({
      where: {
        employeeId,
      },
      orderBy: [{ startDate: 'desc' }],
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      data: absences,
    };
  }

  async create(
    employeeId: string,
    dto: CreateAbsenceDto,
    user: JwtPayload,
    facilityId?: string,
  ) {
    const employee = await this.assertCanManageEmployeeAbsences(
      employeeId,
      user,
      facilityId,
    );

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Nieprawidłowa data rozpoczęcia.');
    }

    if (Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Nieprawidłowa data zakończenia.');
    }

    if (endDate < startDate) {
      throw new BadRequestException(
        'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.',
      );
    }

    if (dto.documentId) {
      const document = await this.prisma.document.findFirst({
        where: {
          id: dto.documentId,
          employeeId,
        },
        select: {
          id: true,
        },
      });

      if (!document) {
        throw new BadRequestException(
          'Dokument nie istnieje albo nie należy do tego pracownika.',
        );
      }
    }

    const absence = await this.prisma.$transaction(async (tx) => {
      const created = await tx.absence.create({
        data: {
          employeeId,
          type: dto.type,
          startDate,
          endDate,
          documentId: dto.documentId || null,
          isApproved: dto.isApproved ?? false,
        },
        include: {
          document: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              createdAt: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: user.sub,
          action: 'ABSENCE_CREATED',
          entityName: 'Absence',
          entityId: created.id,
          oldValues: Prisma.JsonNull,
          newValues: {
            employeeId: employee.id,
            type: created.type,
            startDate: created.startDate.toISOString(),
            endDate: created.endDate.toISOString(),
            documentId: created.documentId,
            isApproved: created.isApproved,
          },
        },
      });

      return created;
    });

    return {
      data: absence,
    };
  }

  async updateApproval(
    absenceId: string,
    isApproved: boolean,
    user: JwtPayload,
    facilityId?: string,
  ) {
    const absence = await this.prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employee: {
          select: {
            id: true,
            facilityId: true,
            isActive: true,
          },
        },
      },
    });

    if (!absence || !absence.employee.isActive) {
      throw new NotFoundException('Nieobecność nie istnieje.');
    }

    await this.assertCanManageEmployeeAbsences(
      absence.employeeId,
      user,
      facilityId,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.absence.update({
        where: { id: absenceId },
        data: {
          isApproved,
        },
        include: {
          document: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              createdAt: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: user.sub,
          action: 'ABSENCE_APPROVAL_UPDATED',
          entityName: 'Absence',
          entityId: absenceId,
          oldValues: {
            isApproved: absence.isApproved,
          },
          newValues: {
            isApproved: result.isApproved,
          },
        },
      });

      return result;
    });

    return {
      data: updated,
    };
  }
}
