import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    // 1. Sprawdzenie unikalności (wczesne wyjście w przypadku duplikatu)
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

    // 2. Wygenerowanie tymczasowego hasła
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // 3. Zapis do bazy danych
    const newEmployee = await this.prisma.employee.create({
      data: {
        ...dto,
        passwordHash,
        isLoginEnabled: true,
      },
    });

    // 4. Zwracamy dane (bezpiecznie usuwając hash hasła z odpowiedzi bez błędu nieużywanej zmiennej)
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
}
