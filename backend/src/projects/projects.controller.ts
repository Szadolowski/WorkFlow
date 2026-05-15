import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  AssignEmployeesDto,
  CreateReaderDto,
} from './dto/projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ścieżki zależne od Twojej struktury
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Tworzenie projektu: tylko dla biura, HR i administracji
  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.HR)
  async createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  // Pobieranie aktywnych projektów: dodatkowo wgląd ma brygadzista
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.HR, UserRole.FOREMAN)
  async getActiveProjects() {
    return this.projectsService.getActiveProjects();
  }

  // Obsada budowy (przypisanie pracowników)
  @Post(':id/assignments')
  @Roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.HR)
  async assignEmployees(
    @Param('id') id: string,
    @Body() dto: AssignEmployeesDto,
  ) {
    return this.projectsService.assignEmployees(id, dto);
  }

  // Rejestracja fizycznego czytnika do projektu
  @Post(':id/readers')
  @Roles(UserRole.ADMIN, UserRole.OFFICE)
  async registerReader(@Param('id') id: string, @Body() dto: CreateReaderDto) {
    return this.projectsService.registerReader(id, dto);
  }
}
