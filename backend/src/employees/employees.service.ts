import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
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
        passwordHash,
        isLoginEnabled: true,
      },
    });

    const employeeResponse = { ...newEmployee } as Partial<typeof newEmployee>;
    delete employeeResponse.passwordHash;

    return {
      ...employeeResponse,
      tempPassword,
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

  async getProfile(id: string) {
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

    // 1. Wyciągamy relacje, żeby zostały nam tylko dane samego pracownika
    const { contracts, assignments, certifications, ...baseEmployee } =
      employee;

    // 2. Bezpiecznie usuwamy wrażliwe dane z obiektu bazowego
    const safeEmployee = { ...baseEmployee } as Partial<typeof baseEmployee>;
    delete safeEmployee.passwordHash;
    delete safeEmployee.twoFactorSecret;

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
