import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanManageEmployeeContracts(
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
      throw new ForbiddenException('Brak uprawnień do zarządzania umowami.');
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
    await this.assertCanManageEmployeeContracts(employeeId, user, facilityId);

    const contracts = await this.prisma.contract.findMany({
      where: {
        employeeId,
      },
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        employeeId: true,
        type: true,
        salaryAmount: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: contracts.map((contract) => ({
        ...contract,
        salaryAmount: contract.salaryAmount.toString(),
      })),
    };
  }

  async create(
    employeeId: string,
    dto: CreateContractDto,
    user: JwtPayload,
    facilityId?: string,
  ) {
    const employee = await this.assertCanManageEmployeeContracts(
      employeeId,
      user,
      facilityId,
    );

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Nieprawidłowa data rozpoczęcia umowy.');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Nieprawidłowa data zakończenia umowy.');
    }

    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.',
      );
    }

    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const contract = await this.prisma.$transaction(async (tx) => {
      const previousCurrentContracts = await tx.contract.findMany({
        where: {
          employeeId,
          isCurrent: true,
        },
        select: {
          id: true,
          type: true,
          salaryAmount: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
      });

      await tx.contract.updateMany({
        where: {
          employeeId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          endDate: previousEndDate,
        },
      });

      const created = await tx.contract.create({
        data: {
          employeeId,
          type: dto.type,
          salaryAmount: dto.salaryAmount,
          startDate,
          endDate,
          isCurrent: true,
        },
        select: {
          id: true,
          employeeId: true,
          type: true,
          salaryAmount: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: user.sub,
          action: 'CONTRACT_CREATED',
          entityName: 'Contract',
          entityId: created.id,
          oldValues: {
            previousCurrentContracts: previousCurrentContracts.map(
              (contract) => ({
                ...contract,
                salaryAmount: contract.salaryAmount.toString(),
                startDate: contract.startDate.toISOString(),
                endDate: contract.endDate?.toISOString() ?? null,
              }),
            ),
          },
          newValues: {
            employeeId: employee.id,
            type: created.type,
            salaryAmount: created.salaryAmount.toString(),
            startDate: created.startDate.toISOString(),
            endDate: created.endDate?.toISOString() ?? null,
            isCurrent: created.isCurrent,
          },
        },
      });

      return created;
    });

    return {
      data: {
        ...contract,
        salaryAmount: contract.salaryAmount.toString(),
      },
    };
  }
}
