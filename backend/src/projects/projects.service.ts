import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  AssignEmployeesDto,
  CreateReaderDto,
} from './dto/projects.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    const existingProject = await this.prisma.project.findUnique({
      where: { internalCode: dto.internalCode },
    });

    if (existingProject) {
      throw new ConflictException(
        'Projekt o podanym kodzie wewnętrznym już istnieje.',
      );
    }

    return this.prisma.project.create({
      data: dto,
    });
  }

  async getActiveProjects() {
    return this.prisma.project.findMany({
      where: { status: ProjectStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
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
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
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
        serialNumber: dto.serialNumber,
        locationName: dto.locationName,
      },
    });
  }

  async getProjectDetails(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        // ZMIANA TUTAJ: używamy nazwy "assignments" z Twojego schematu
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
