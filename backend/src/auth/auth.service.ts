import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from '@/auth/dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';

type FacilitySummary = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async getAccessibleFacilityIds(employeeId: string, role: UserRole) {
    if (role === UserRole.ADMIN) {
      const allFacilities = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Facility"
        ORDER BY "createdAt" ASC
      `;

      return allFacilities.map((facility) => facility.id);
    }

    const rows = await this.prisma.$queryRaw<Array<{ facilityId: string }>>`
      SELECT DISTINCT "facilityId"
      FROM "EmployeeFacilityAccess"
      WHERE "employeeId" = ${employeeId}
      UNION
      SELECT "facilityId"
      FROM "Employee"
      WHERE id = ${employeeId}
    `;

    return [...new Set(rows.map((row) => row.facilityId))];
  }

  private async getFacilitiesByIds(facilityIds: string[]) {
    if (facilityIds.length === 0) {
      return [];
    }

    const facilities = await this.prisma.$queryRaw<Array<FacilitySummary>>`
      SELECT id, name, code, address
      FROM "Facility"
      WHERE id = ANY(${facilityIds}::uuid[])
      ORDER BY "createdAt" ASC
    `;

    return facilities;
  }

  private async buildUserProfile(
    employeeId: string,
    activeFacilityId: string,
    role: UserRole,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        facilityId: true,
        isActive: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Użytkownik nie istnieje.');
    }

    const facilityIds = await this.getAccessibleFacilityIds(employee.id, role);
    const facilities = await this.getFacilitiesByIds(facilityIds);

    if (activeFacilityId && !facilityIds.includes(activeFacilityId)) {
      throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
    }

    return {
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        activeFacilityId: activeFacilityId || employee.facilityId,
        facilityIds,
        facilities,
      },
    };
  }

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    // Zabezpieczenie: Odwracamy żądanie jeśli user nie istnieje
    // LUB jeśli nie ma ustawionego hasła (passwordHash jest null)
    if (!employee || !employee.passwordHash) {
      throw new UnauthorizedException('Błędne poświadczenia');
    }

    if (!employee.isActive || !employee.isLoginEnabled) {
      throw new UnauthorizedException(
        'Konto nieaktywne lub brak dostępu do logowania',
      );
    }

    // TypeScript teraz wie, że employee.passwordHash na 100% jest stringiem
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      employee.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Błędne poświadczenia');
    }

    const facilityIds = await this.getAccessibleFacilityIds(
      employee.id,
      employee.role,
    );

    const payload = {
      sub: employee.id,
      role: employee.role,
      facilityIds,
      activeFacilityId: employee.facilityId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMe(user: JwtPayload, activeFacilityId?: string) {
    return this.buildUserProfile(
      user.sub,
      activeFacilityId || user.activeFacilityId,
      user.role,
    );
  }
}
