import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
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

type UserRoleRequest = {
  user: {
    role: UserRole;
  };
};

type UserProfileRequest = {
  user: {
    role: UserRole;
    sub: string;
  };
};

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.employeesService.create(createEmployeeDto, facilityId);
  }

  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.OFFICE, UserRole.ACCOUNTING)
  @Get()
  findAll(@Query() query: GetEmployeesDto, @Req() req: UserRoleRequest) {
    return this.employeesService.findAll(query, req.user.role);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
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
  async getProfile(
    @Param('id') id: string,
    @Req() req: UserProfileRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    const user = req.user;

    return this.employeesService.getProfile(
      id,
      user.role,
      facilityId,
      user.sub,
    );
  }

  // === NOWY ENDPOINT: ZAPIS DOKUMENTU DO BAZY ===
  @Post(':id/documents')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Zapisuje w bazie wgrany dokument dla pracownika' })
  async addDocument(
    @Param('id') id: string,
    @Body() body: { fileName: string; fileKey: string },
  ) {
    return this.employeesService.addDocument(id, body.fileName, body.fileKey);
  }
}
