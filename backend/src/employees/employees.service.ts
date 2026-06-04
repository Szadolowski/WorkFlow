import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateEmployeeAccessDto } from './dto/update-employee-access.dto';
import { AddEmployeeDocumentDto } from './dto/add-employee-document.dto';
import { StorageService } from '@/storage/storage.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private toEmployeeResponse(employee: {
    id: string;
    firstName: string;
    lastName: string;
    pesel: string | null;
    email: string | null;
    role: UserRole;
    isActive: boolean;
    isLoginEnabled: boolean;
    createdAt: Date;
  }) {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      pesel: employee.pesel,
      email: employee.email,
      role: employee.role,
      isActive: employee.isActive,
      isLoginEnabled: employee.isLoginEnabled,
      createdAt: employee.createdAt,
    };
  }

  async create(dto: CreateEmployeeDto, facilityId?: string) {
    if (!facilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ email: dto.email }, { pesel: dto.pesel }],
      },
    });

    if (existingEmployee) {
      if (existingEmployee.email === dto.email) {
        throw new ConflictException(
          'Pracownik z tym adresem e-mail już istnieje.',
        );
      }
      throw new ConflictException(
        'Pracownik z tym numerem PESEL już istnieje.',
      );
    }

    const newEmployee = await this.prisma.employee.create({
      data: {
        ...dto,
        facilityId,
        role: UserRole.WORKER,
        isLoginEnabled: false,
        passwordHash: null,
      },
    });

    await this.prisma.$executeRaw`
      INSERT INTO "EmployeeFacilityAccess" ("employeeId", "facilityId", "createdAt")
      VALUES (${newEmployee.id}, ${facilityId}, NOW())
      ON CONFLICT ("employeeId", "facilityId") DO NOTHING
    `;

    return {
      data: this.toEmployeeResponse(newEmployee),
    };
  }

  async update(
    employeeId: string,
    dto: UpdateEmployeeDto,
    requestingUser: {
      sub: string;
      role: UserRole;
      facilityIds: string[];
    },
    facilityId?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        facilityId: true,
        firstName: true,
        lastName: true,
        pesel: true,
        rfidCardId: true,
        email: true,
        isActive: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jest nieaktywny.',
      );
    }

    const isAdmin = requestingUser.role === UserRole.ADMIN;
    const isHr = requestingUser.role === UserRole.HR;

    if (!isAdmin && !isHr) {
      throw new ForbiddenException(
        'Brak uprawnień do edycji danych pracownika.',
      );
    }

    if (!isAdmin) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      if (!requestingUser.facilityIds.includes(facilityId)) {
        throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
      }

      const accessRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT 1 AS id
      FROM "EmployeeFacilityAccess"
      WHERE "employeeId" = ${employeeId} AND "facilityId" = ${facilityId}
      LIMIT 1
    `;

      if (accessRows.length === 0 && employee.facilityId !== facilityId) {
        throw new ForbiddenException('Brak dostępu do tego pracownika.');
      }
    }

    const normalizedEmail = dto.email?.trim() || null;
    const normalizedPesel = dto.pesel?.trim() || null;
    const normalizedRfidCardId = dto.rfidCardId?.trim() || null;

    const conflicts = await this.prisma.employee.findFirst({
      where: {
        id: {
          not: employeeId,
        },
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPesel ? [{ pesel: normalizedPesel }] : []),
          ...(normalizedRfidCardId
            ? [{ rfidCardId: normalizedRfidCardId }]
            : []),
        ],
      },
      select: {
        id: true,
        email: true,
        pesel: true,
        rfidCardId: true,
      },
    });

    if (conflicts) {
      if (normalizedEmail && conflicts.email === normalizedEmail) {
        throw new ConflictException(
          'Pracownik z tym adresem e-mail już istnieje.',
        );
      }

      if (normalizedPesel && conflicts.pesel === normalizedPesel) {
        throw new ConflictException(
          'Pracownik z tym numerem PESEL już istnieje.',
        );
      }

      if (
        normalizedRfidCardId &&
        conflicts.rfidCardId === normalizedRfidCardId
      ) {
        throw new ConflictException(
          'Pracownik z tym numerem karty RFID już istnieje.',
        );
      }
    }

    const updatedEmployee = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: {
          ...(dto.firstName !== undefined
            ? { firstName: dto.firstName.trim() }
            : {}),
          ...(dto.lastName !== undefined
            ? { lastName: dto.lastName.trim() }
            : {}),
          ...(dto.pesel !== undefined ? { pesel: normalizedPesel } : {}),
          ...(dto.rfidCardId !== undefined
            ? { rfidCardId: normalizedRfidCardId }
            : {}),
          ...(dto.email !== undefined ? { email: normalizedEmail } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          pesel: true,
          email: true,
          role: true,
          isActive: true,
          isLoginEnabled: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: requestingUser.sub,
          action: 'EMPLOYEE_PROFILE_UPDATED',
          entityName: 'Employee',
          entityId: employeeId,
          oldValues: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            pesel: employee.pesel,
            rfidCardId: employee.rfidCardId,
            email: employee.email,
          },
          newValues: {
            firstName: updated.firstName,
            lastName: updated.lastName,
            pesel: updated.pesel,
            rfidCardId: normalizedRfidCardId,
            email: updated.email,
          },
        },
      });

      return updated;
    });

    return {
      data: this.toEmployeeResponse(updatedEmployee),
    };
  }

  async updateAccess(
    employeeId: string,
    dto: UpdateEmployeeAccessDto,
    adminEmployeeId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pesel: true,
        email: true,
        role: true,
        isActive: true,
        isLoginEnabled: true,
        createdAt: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jest nieaktywny.',
      );
    }

    if (!employee.email) {
      throw new ForbiddenException(
        'Nie można aktywować dostępu bez adresu e-mail pracownika.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 10);

    const updatedEmployee = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: {
          role: dto.role,
          passwordHash,
          isLoginEnabled: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          pesel: true,
          email: true,
          role: true,
          isActive: true,
          isLoginEnabled: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: adminEmployeeId,
          action: 'EMPLOYEE_ACCESS_ACTIVATED',
          entityName: 'Employee',
          entityId: employeeId,
          oldValues: {
            role: employee.role,
            isLoginEnabled: employee.isLoginEnabled,
          },
          newValues: {
            role: updated.role,
            isLoginEnabled: updated.isLoginEnabled,
          },
        },
      });

      return updated;
    });

    return {
      data: this.toEmployeeResponse(updatedEmployee),
    };
  }

  async revokeAccess(employeeId: string, adminEmployeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pesel: true,
        email: true,
        role: true,
        isActive: true,
        isLoginEnabled: true,
        createdAt: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Pracownik nie został znaleziony.');
    }

    const updatedEmployee = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: {
          role: UserRole.WORKER,
          passwordHash: null,
          isLoginEnabled: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          pesel: true,
          email: true,
          role: true,
          isActive: true,
          isLoginEnabled: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: adminEmployeeId,
          action: 'EMPLOYEE_ACCESS_REVOKED',
          entityName: 'Employee',
          entityId: employeeId,
          oldValues: {
            role: employee.role,
            isLoginEnabled: employee.isLoginEnabled,
          },
          newValues: {
            role: updated.role,
            isLoginEnabled: updated.isLoginEnabled,
          },
        },
      });

      return updated;
    });

    return {
      data: this.toEmployeeResponse(updatedEmployee),
    };
  }

  async findAll(query: GetEmployeesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (!query.facilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    const accessibleEmployeeIds = await this.prisma.$queryRaw<
      { employeeId: string }[]
    >`
      SELECT DISTINCT "employeeId"
      FROM "EmployeeFacilityAccess"
      WHERE "facilityId" = ${query.facilityId}
    `;

    where.id = {
      in: accessibleEmployeeIds.map((row) => row.employeeId),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          pesel: true,
          role: true,
          isActive: true,
          isLoginEnabled: true,
          createdAt: true,
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProfile(
    id: string,
    facilityId: string | undefined,
    requestingUser: { sub: string; role: UserRole; facilityIds: string[] },
  ) {
    const isOwnProfile = requestingUser.sub === id;
    const isAdmin = requestingUser.role === UserRole.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      const allowedRoles: UserRole[] = [
        UserRole.HR,
        UserRole.OFFICE,
        UserRole.ACCOUNTING,
      ];

      if (!allowedRoles.includes(requestingUser.role)) {
        throw new ForbiddenException('Brak uprawnień do przeglądania profilu.');
      }

      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      if (!requestingUser.facilityIds.includes(facilityId)) {
        throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
      }

      const accessRows = await this.prisma.$queryRaw<{ id: string }[]>`
    SELECT 1 AS id
    FROM "EmployeeFacilityAccess"
    WHERE "employeeId" = ${id} AND "facilityId" = ${facilityId}
    LIMIT 1
  `;

      if (accessRows.length === 0) {
        throw new ForbiddenException('Brak dostępu do tego profilu.');
      }
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            project: true,
          },
        },
        contracts: {
          where: { isCurrent: true },
          take: 1,
        },
        certifications: {
          where: { expiresAt: { gt: new Date() } },
          include: {
            dictionary: true,
          },
        },

        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jego profil jest nieaktywny.',
      );
    }

    const {
      contracts,
      assignments,
      certifications,
      documents,
      ...baseEmployee
    } = employee;

    const safeEmployee = { ...baseEmployee } as Partial<typeof baseEmployee>;
    delete safeEmployee.passwordHash;
    delete safeEmployee.twoFactorSecret;

    return {
      data: {
        ...safeEmployee,
        currentContract: contracts.length > 0 ? contracts[0] : null,
        activeAssignments: assignments,
        validCertifications: certifications,
        documents: documents,
      },
    };
  }

  async addDocument(employeeId: string, dto: AddEmployeeDocumentDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jest nieaktywny.',
      );
    }

    const document = await this.prisma.document.create({
      data: {
        employeeId,
        fileName: dto.fileName,
        fileUrl: dto.fileKey,
      },
      select: {
        id: true,
        employeeId: true,
        fileName: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    return {
      data: document,
    };
  }
  async getDocumentDownloadUrl(
    employeeId: string,
    documentId: string,
    facilityId: string | undefined,
    requestingUser: { sub: string; role: UserRole; facilityIds?: string[] },
  ) {
    if (requestingUser.sub !== employeeId) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      if (
        requestingUser.role !== UserRole.ADMIN &&
        !requestingUser.facilityIds?.includes(facilityId)
      ) {
        throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
      }
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        employeeId: true,
        fileUrl: true,
        employee: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!document || document.employeeId !== employeeId) {
      throw new NotFoundException('Dokument nie został znaleziony.');
    }

    if (!document.employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jest nieaktywny.',
      );
    }

    if (requestingUser.sub !== employeeId) {
      const accessRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT 1 AS id
        FROM "EmployeeFacilityAccess"
        WHERE "employeeId" = ${employeeId} AND "facilityId" = ${facilityId}
        LIMIT 1
      `;

      if (accessRows.length === 0) {
        throw new ForbiddenException('Brak dostępu do dokumentu pracownika.');
      }
    }

    const url = await this.storageService.getPresignedDownloadUrl(
      document.fileUrl,
      900,
    );

    return {
      data: {
        url,
      },
    };
  }

  async getDocumentUploadUrl(
    employeeId: string,
    fileName: string,
    facilityId: string | undefined,
    requestingUser: { sub: string; role: UserRole; facilityIds?: string[] },
  ) {
    if (!fileName) {
      throw new BadRequestException('Brak parametru fileName');
    }

    if (requestingUser.sub !== employeeId) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      if (
        requestingUser.role !== UserRole.ADMIN &&
        !requestingUser.facilityIds?.includes(facilityId)
      ) {
        throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
      }

      const accessRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT 1 AS id
        FROM "EmployeeFacilityAccess"
        WHERE "employeeId" = ${employeeId} AND "facilityId" = ${facilityId}
        LIMIT 1
      `;

      if (accessRows.length === 0) {
        throw new ForbiddenException('Brak dostępu do dokumentów pracownika.');
      }
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, isActive: true },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jest nieaktywny.',
      );
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileKey = `employees/${employeeId}/documents/${Date.now()}-${sanitizedName}`;

    const url = await this.storageService.getPresignedUploadUrl(
      uniqueFileKey,
      900,
    );

    return {
      data: {
        url,
        fileKey: uniqueFileKey,
      },
    };
  }
}
