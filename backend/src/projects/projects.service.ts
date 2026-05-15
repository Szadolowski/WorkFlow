import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ścieżka do Twojego PrismaService
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

    // Wykonujemy operację w transakcji, aby zachować spójność danych (ACID)
    return this.prisma.$transaction(async (tx) => {
      // 1. Zakończ aktualne (aktywne) przypisania dla podanych pracowników
      await tx.employeeAssignment.updateMany({
        where: {
          employeeId: { in: dto.employeeIds },
          unassignedAt: null, // Tylko trwające przypisania
        },
        data: {
          unassignedAt: new Date(),
        },
      });

      // 2. Utwórz nowe przypisania do wskazanego projektu
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
}
