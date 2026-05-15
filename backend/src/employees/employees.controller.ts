import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Globalne zabezpieczenie całego kontrolera
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Tylko ADMIN i HR mogą dodawać pracowników
  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  // Odczyt z paginacją - dostęp dla biura i księgowości
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.OFFICE, UserRole.ACCOUNTING)
  @Get()
  findAll(@Query() query: GetEmployeesDto) {
    return this.employeesService.findAll(query);
  }
}
