import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Zawsze filtrujemy po aktywnym zakładzie. Nawet ADMIN będzie widział tylko
    // pracowników przypisanych do aktualnego `facilityId` (zgodnie z wymaganiem).
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
    _role: UserRole,
    facilityId?: string,
    requestingUserId?: string,
  ) {
    if (requestingUserId !== id) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
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
        // ---> TUTAJ POBIERAMY DOKUMENTY <---
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

    // ---> DODALIŚMY 'documents' DO DESTRUKTURYZACJI <---
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
        documents: documents, // ---> WYSTAWIAMY DOKUMENTY NA FRONTEND <---
      },
    };
  }
  async addDocument(employeeId: string, fileName: string, fileKey: string) {
    return this.prisma.document.create({
      data: {
        employeeId,
        fileName,
        fileUrl: fileKey, // w fileUrl trzymamy klucz MinIO
      },
    });
  }
}
