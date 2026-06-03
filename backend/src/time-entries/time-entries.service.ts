import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TimeEntryStatus, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { UpdateTimeEntryStatusDto } from './dto/update-time-entry-status.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertCanAccessFacility(user: JwtPayload, facilityId: string) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (!user.facilityIds?.includes(facilityId)) {
      throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
    }
  }

  async findPending(facilityId: string | undefined, user: JwtPayload) {
    if (!facilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    this.assertCanAccessFacility(user, facilityId);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        status: TimeEntryStatus.PENDING,
        project: {
          facilityId,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        calculatedHours: true,
        status: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            facilityId: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 100,
    });

    return {
      data: entries,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateTimeEntryStatusDto,
    user: JwtPayload,
  ) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        project: {
          select: {
            facilityId: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Wpis czasu pracy nie istnieje.');
    }

    this.assertCanAccessFacility(user, entry.project.facilityId);

    if (entry.status !== TimeEntryStatus.PENDING) {
      throw new BadRequestException(
        'Można zmienić status tylko wpisu oczekującego.',
      );
    }

    const updatedEntry = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.timeEntry.update({
        where: { id },
        data: {
          status: dto.status,
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          calculatedHours: true,
          status: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              facilityId: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: user.sub,
          action:
            dto.status === TimeEntryStatus.APPROVED
              ? 'TIME_ENTRY_APPROVED'
              : 'TIME_ENTRY_REJECTED',
          entityName: 'TimeEntry',
          entityId: id,
          oldValues: {
            status: entry.status,
          },
          newValues: {
            status: dto.status,
            employeeId: updated.employee.id,
            projectId: updated.project.id,
            startTime: updated.startTime,
            endTime: updated.endTime,
            calculatedHours: updated.calculatedHours.toString(),
          },
        },
      });

      return updated;
    });

    return {
      data: updatedEntry,
    };
  }
}
