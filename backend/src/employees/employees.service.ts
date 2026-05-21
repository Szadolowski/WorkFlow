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
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newEmployee = await this.prisma.employee.create({
      data: {
        ...dto,
        facilityId,
        passwordHash,
        isLoginEnabled: true,
      },
    });

    await this.prisma.$executeRaw`
      INSERT INTO "EmployeeFacilityAccess" ("employeeId", "facilityId", "createdAt")
      VALUES (${newEmployee.id}, ${facilityId}, NOW())
      ON CONFLICT ("employeeId", "facilityId") DO NOTHING
    `;

    const employeeResponse = { ...newEmployee } as Partial<typeof newEmployee>;
    delete employeeResponse.passwordHash;

    return {
      ...employeeResponse,
      tempPassword,
    };
  }

  async findAll(query: GetEmployeesDto, role: UserRole) {
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
    role: UserRole,
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
      },
    });

    if (!employee || !employee.isActive) {
      throw new NotFoundException(
        'Pracownik nie został znaleziony lub jego profil jest nieaktywny.',
      );
    }

    // --- ZMIANA TUTAJ: Nie przypisujemy hasła do zmiennej, tylko od razu usuwamy ---
    const { contracts, assignments, certifications, ...baseEmployee } =
      employee;

    const safeEmployee = { ...baseEmployee } as Partial<typeof baseEmployee>;
    delete safeEmployee.passwordHash;
    delete safeEmployee.twoFactorSecret;

    // Zwracamy odpowiedź ściśle zgodną z naszym standardem { data: ... } i DTO
    return {
      data: {
        ...safeEmployee,
        currentContract: contracts.length > 0 ? contracts[0] : null,
        activeAssignments: assignments,
        validCertifications: certifications,
      },
    };
  }
}
