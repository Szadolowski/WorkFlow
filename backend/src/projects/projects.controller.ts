import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  AssignEmployeesDto,
  CreateReaderDto,
} from './dto/projects.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/guards/jwt-auth.guard';
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
  async createProject(
    @Body() dto: CreateProjectDto,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.projectsService.createProject(dto, facilityId);
  }

  // Pobieranie aktywnych projektów: dodatkowo wgląd ma brygadzista
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.HR, UserRole.FOREMAN)
  async getActiveProjects(
    @Query('facilityId') facilityId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.getActiveProjects(req.user.role, facilityId);
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.HR, UserRole.FOREMAN)
  async getProjectDetails(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.projectsService.getProjectDetails(
      id,
      req.user.role,
      facilityId,
    );
  }
}
