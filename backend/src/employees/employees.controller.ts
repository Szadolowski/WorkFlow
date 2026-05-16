import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { EmployeeProfileResponseDto } from './dto/employee-profile-response.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees') // Zgodnie z naszą zasadą o prefixie /api/v1/
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.OFFICE, UserRole.ACCOUNTING)
  @Get()
  findAll(@Query() query: GetEmployeesDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary:
      'Pobierz pełny profil pracownika (dla HR, Biura lub samego pracownika)',
  })
  @ApiResponse({ status: 200, type: EmployeeProfileResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Brak uprawnień do przeglądania tego profilu.',
  })
  @ApiResponse({ status: 404, description: 'Pracownik nie istnieje.' })
  // TUTAJ ZMIANA: Zastępujemy "req: any" dokładnym typem obiektu user
  async getProfile(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    const user = req.user;

    const elevatedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.HR,
      UserRole.OFFICE,
    ];

    const hasElevatedAccess = elevatedRoles.includes(user.role);
    const isProfileOwner = user.id === id;

    if (!hasElevatedAccess && !isProfileOwner) {
      throw new ForbiddenException(
        'Brak uprawnień do przeglądania tego profilu.',
      );
    }

    return this.employeesService.getProfile(id);
  }
}
