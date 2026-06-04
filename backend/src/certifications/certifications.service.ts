import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { CreateCertificationDictionaryDto } from './dto/create-certification-dictionary.dto';
import { UpdateCertificationDictionaryDto } from './dto/update-certification-dictionary.dto';
import { CreateEmployeeCertificationDto } from './dto/create-employee-certification.dto';

@Injectable()
export class CertificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanManageEmployeeCertifications(
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
        'Brak uprawnień do zarządzania certyfikatami.',
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

  async findDictionary() {
    const items = await this.prisma.certificationDictionary.findMany({
      orderBy: [{ isActive: 'desc' }, { type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        defaultValidityMonths: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      data: items,
    };
  }

  async createDictionary(dto: CreateCertificationDictionaryDto) {
    const existing = await this.prisma.certificationDictionary.findUnique({
      where: { name: dto.name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Pozycja słownika o tej nazwie już istnieje.',
      );
    }

    const item = await this.prisma.certificationDictionary.create({
      data: {
        type: dto.type,
        name: dto.name,
        description: dto.description || null,
        defaultValidityMonths: dto.defaultValidityMonths || null,
      },
    });

    return {
      data: item,
    };
  }

  async updateDictionary(id: string, dto: UpdateCertificationDictionaryDto) {
    const existing = await this.prisma.certificationDictionary.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundException('Pozycja słownika nie istnieje.');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameOwner = await this.prisma.certificationDictionary.findUnique({
        where: { name: dto.name },
        select: { id: true },
      });

      if (nameOwner && nameOwner.id !== id) {
        throw new ConflictException(
          'Pozycja słownika o tej nazwie już istnieje.',
        );
      }
    }

    const updated = await this.prisma.certificationDictionary.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description || null }
          : {}),
        ...(dto.defaultValidityMonths !== undefined
          ? { defaultValidityMonths: dto.defaultValidityMonths || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return {
      data: updated,
    };
  }

  async findEmployeeCertifications(
    employeeId: string,
    user: JwtPayload,
    facilityId?: string,
  ) {
    await this.assertCanManageEmployeeCertifications(
      employeeId,
      user,
      facilityId,
    );

    const certifications = await this.prisma.employeeCertification.findMany({
      where: {
        employeeId,
      },
      orderBy: [{ expiresAt: 'asc' }],
      include: {
        dictionary: true,
        documents: {
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
      data: certifications,
    };
  }

  async createEmployeeCertification(
    employeeId: string,
    dto: CreateEmployeeCertificationDto,
    user: JwtPayload,
    facilityId?: string,
  ) {
    const employee = await this.assertCanManageEmployeeCertifications(
      employeeId,
      user,
      facilityId,
    );

    const dictionary = await this.prisma.certificationDictionary.findUnique({
      where: { id: dto.dictionaryId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!dictionary || !dictionary.isActive) {
      throw new BadRequestException(
        'Wybrana pozycja słownika nie istnieje lub jest nieaktywna.',
      );
    }

    const issuedAt = new Date(dto.issuedAt);
    const expiresAt = new Date(dto.expiresAt);

    if (Number.isNaN(issuedAt.getTime())) {
      throw new BadRequestException('Nieprawidłowa data wydania.');
    }

    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Nieprawidłowa data ważności.');
    }

    if (expiresAt < issuedAt) {
      throw new BadRequestException(
        'Data ważności nie może być wcześniejsza niż data wydania.',
      );
    }

    const documentIds = dto.documentIds || [];

    if (documentIds.length > 0) {
      const documents = await this.prisma.document.findMany({
        where: {
          id: {
            in: documentIds,
          },
          employeeId,
        },
        select: {
          id: true,
        },
      });

      if (documents.length !== documentIds.length) {
        throw new BadRequestException(
          'Niektóre dokumenty nie istnieją albo nie należą do tego pracownika.',
        );
      }
    }

    const certification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employeeCertification.create({
        data: {
          employeeId,
          dictionaryId: dto.dictionaryId,
          certificateNumber: dto.certificateNumber || null,
          issuedAt,
          expiresAt,
        },
        include: {
          dictionary: true,
          documents: true,
        },
      });

      if (documentIds.length > 0) {
        await tx.document.updateMany({
          where: {
            id: {
              in: documentIds,
            },
            employeeId,
          },
          data: {
            certificationId: created.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          employeeId: user.sub,
          action: 'EMPLOYEE_CERTIFICATION_CREATED',
          entityName: 'EmployeeCertification',
          entityId: created.id,
          oldValues: Prisma.JsonNull,
          newValues: {
            employeeId: employee.id,
            dictionaryId: dto.dictionaryId,
            certificateNumber: dto.certificateNumber || null,
            issuedAt: issuedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            documentIds,
          },
        },
      });

      return tx.employeeCertification.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          dictionary: true,
          documents: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              createdAt: true,
            },
          },
        },
      });
    });

    return {
      data: certification,
    };
  }
}
