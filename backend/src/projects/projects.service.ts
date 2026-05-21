import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  AssignEmployeesDto,
  CreateReaderDto,
} from './dto/projects.dto';
import { ProjectStatus, UserRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto, facilityId?: string) {
    if (!facilityId) {
      throw new ForbiddenException('Brak aktywnego zakładu.');
    }

    const existingProject = await this.prisma.project.findUnique({
      where: { internalCode: dto.internalCode },
    });

    if (existingProject) {
      throw new ConflictException(
        'Projekt o podanym kodzie wewnętrznym już istnieje.',
      );
    }

    return this.prisma.project.create({
      data: {
        ...dto,
        facilityId,
      },
    });
  }

  async getActiveProjects(role: UserRole, facilityId?: string) {
    if (role !== UserRole.ADMIN) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      return this.prisma.$queryRaw`
        SELECT id, name, "internalCode", address, status, "startDate", "endDate", "createdAt", "updatedAt"
        FROM "Project"
        WHERE status = ${ProjectStatus.ACTIVE} AND "facilityId" = ${facilityId}
        ORDER BY "createdAt" DESC
      `;
    }

    return this.prisma.$queryRaw`
      SELECT id, name, "internalCode", address, status, "startDate", "endDate", "createdAt", "updatedAt"
      FROM "Project"
      WHERE status = ${ProjectStatus.ACTIVE}
      ORDER BY "createdAt" DESC
    `;
  }

  async assignEmployees(projectId: string, dto: AssignEmployeesDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Projekt nie istnieje.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.employeeAssignment.updateMany({
        where: {
          employeeId: { in: dto.employeeIds },
          unassignedAt: null,
        },
        data: {
          unassignedAt: new Date(),
        },
      });

      const newAssignments = dto.employeeIds.map((employeeId) => ({
        employeeId,
        projectId,
      }));

      await tx.employeeAssignment.createMany({
        data: newAssignments,
      });

      return { message: 'Pracownicy zostali pomyślnie przypisani.' };
    });
  }

  async registerReader(projectId: string, dto: CreateReaderDto) {
    const projectRows = await this.prisma.$queryRaw<{ facilityId: string }[]>`
      SELECT "facilityId"
      FROM "Project"
      WHERE id = ${projectId}
      LIMIT 1
    `;

    const facilityId = projectRows[0]?.facilityId;

    if (!facilityId) {
      throw new NotFoundException('Projekt nie istnieje.');
    }

    const existingReader = await this.prisma.reader.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingReader) {
      throw new ConflictException(
        'Czytnik o tym numerze seryjnym jest już zarejestrowany.',
      );
    }

    return this.prisma.reader.create({
      data: {
        projectId,
        facilityId,
        serialNumber: dto.serialNumber,
        locationName: dto.locationName,
      },
    });
  }

  async getProjectDetails(
    projectId: string,
    role: UserRole,
    facilityId?: string,
  ) {
    if (role !== UserRole.ADMIN) {
      if (!facilityId) {
        throw new ForbiddenException('Brak aktywnego zakładu.');
      }

      const accessRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT 1 AS id
        FROM "Project"
        WHERE id = ${projectId} AND "facilityId" = ${facilityId}
        LIMIT 1
      `;

      if (accessRows.length === 0) {
        throw new NotFoundException('Projekt nie istnieje.');
      }
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Projekt nie istnieje.');
    return project;
  }
}
