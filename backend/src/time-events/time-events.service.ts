import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TimeEntryStatus, TimeEventAction } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DeviceTimeEventDto } from './dto/device-time-event.dto';

@Injectable()
export class TimeEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestDeviceEvent(dto: DeviceTimeEventDto) {
    const reader = await this.prisma.reader.findUnique({
      where: { serialNumber: dto.readerSerialNumber },
      select: {
        id: true,
        projectId: true,
        facilityId: true,
        isActive: true,
      },
    });

    if (!reader || !reader.isActive) {
      throw new NotFoundException('Czytnik nie istnieje lub jest nieaktywny.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { rfidCardId: dto.rfidCardId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        facilityId: true,
        isActive: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie istnieje lub jest nieaktywny.',
      );
    }

    const facilityAccess = await this.prisma.employeeFacilityAccess.findUnique({
      where: {
        employeeId_facilityId: {
          employeeId: employee.id,
          facilityId: reader.facilityId,
        },
      },
      select: {
        id: true,
      },
    });

    if (employee.facilityId !== reader.facilityId && !facilityAccess) {
      throw new ForbiddenException(
        'Pracownik nie ma dostępu do zakładu czytnika.',
      );
    }

    const eventTime = new Date(dto.eventTime);

    if (Number.isNaN(eventTime.getTime())) {
      throw new BadRequestException('Nieprawidłowa data zdarzenia.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const timeEvent = await tx.timeEvent.create({
        data: {
          employeeId: employee.id,
          readerId: reader.id,
          action: dto.action,
          eventTime,
        },
        select: {
          id: true,
          employeeId: true,
          readerId: true,
          action: true,
          eventTime: true,
          createdAt: true,
        },
      });

      if (dto.action === TimeEventAction.IN) {
        return {
          timeEvent,
          timeEntry: null,
        };
      }

      const lastInEvent = await tx.timeEvent.findFirst({
        where: {
          employeeId: employee.id,
          readerId: reader.id,
          action: TimeEventAction.IN,
          eventTime: {
            lt: eventTime,
          },
        },
        orderBy: {
          eventTime: 'desc',
        },
      });

      if (!lastInEvent) {
        throw new BadRequestException(
          'Nie można utworzyć wpisu czasu pracy bez wcześniejszego wejścia IN.',
        );
      }

      const existingEntry = await tx.timeEntry.findFirst({
        where: {
          employeeId: employee.id,
          projectId: reader.projectId,
          startTime: lastInEvent.eventTime,
        },
        select: {
          id: true,
          employeeId: true,
          projectId: true,
          startTime: true,
          endTime: true,
          calculatedHours: true,
          status: true,
        },
      });

      if (existingEntry) {
        return {
          timeEvent,
          timeEntry: existingEntry,
        };
      }

      const diffMs = eventTime.getTime() - lastInEvent.eventTime.getTime();
      const calculatedHours = Math.round((diffMs / 1000 / 60 / 60) * 100) / 100;

      if (calculatedHours <= 0 || calculatedHours > 24) {
        throw new BadRequestException(
          'Nieprawidłowy zakres czasu pracy dla pary IN/OUT.',
        );
      }

      const timeEntry = await tx.timeEntry.create({
        data: {
          employeeId: employee.id,
          projectId: reader.projectId,
          startTime: lastInEvent.eventTime,
          endTime: eventTime,
          calculatedHours,
          status: TimeEntryStatus.PENDING,
        },
        select: {
          id: true,
          employeeId: true,
          projectId: true,
          startTime: true,
          endTime: true,
          calculatedHours: true,
          status: true,
        },
      });

      return {
        timeEvent,
        timeEntry,
      };
    });

    return {
      data: result,
    };
  }
}
