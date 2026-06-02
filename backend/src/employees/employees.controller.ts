import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Param,
  Req,
  Delete,
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
import {
  EmployeeListResponseDto,
  EmployeeSingleResponseDto,
} from './dto/employee-response.dto';
import { UpdateEmployeeAccessDto } from './dto/update-employee-access.dto';
import { AddEmployeeDocumentDto } from './dto/add-employee-document.dto';
import { EmployeeDocumentSingleResponseDto } from './dto/employee-document-response.dto';

type AuthenticatedEmployeeRequest = {
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
  @ApiOperation({
    summary: 'Dodaje pracownika do ewidencji kadrowej',
    description:
      'Tworzy rekord pracownika bez aktywowania konta logowania. Dostęp do systemu powinien zostać skonfigurowany osobnym procesem przez administratora.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pracownik został dodany do ewidencji.',
    type: EmployeeSingleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Brak aktywnego zakładu lub brak uprawnień.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Pracownik z podanym adresem e-mail lub numerem PESEL już istnieje.',
  })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.employeesService.create(createEmployeeDto, facilityId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/access')
  @ApiOperation({
    summary: 'Aktywuje dostęp pracownika do systemu',
    description:
      'Nadaje pracownikowi rolę systemową, ustawia hasło tymczasowe i włącza możliwość logowania. Operacja dostępna wyłącznie dla administratora.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dostęp pracownika został aktywowany.',
    type: EmployeeSingleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Brak uprawnień lub brak adresu e-mail pracownika.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pracownik nie istnieje lub jest nieaktywny.',
  })
  updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeAccessDto,
    @Req() req: AuthenticatedEmployeeRequest,
  ) {
    return this.employeesService.updateAccess(id, dto, req.user.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/access')
  @ApiOperation({
    summary: 'Odbiera pracownikowi dostęp do systemu',
    description:
      'Wyłącza możliwość logowania, usuwa hash hasła i resetuje rolę systemową do WORKER. Operacja dostępna wyłącznie dla administratora.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dostęp pracownika został odebrany.',
    type: EmployeeSingleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pracownik nie istnieje.',
  })
  revokeAccess(
    @Param('id') id: string,
    @Req() req: AuthenticatedEmployeeRequest,
  ) {
    return this.employeesService.revokeAccess(id, req.user.sub);
  }

  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.OFFICE, UserRole.ACCOUNTING)
  @Get()
  @ApiOperation({
    summary: 'Pobiera listę pracowników',
    description:
      'Zwraca listę pracowników z możliwością filtrowania i stronicowania.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista pracowników została pobrana.',
    type: EmployeeListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Brak aktywnego zakładu lub brak uprawnień.',
  })
  findAll(@Query() query: GetEmployeesDto) {
    return this.employeesService.findAll(query);
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
    @Req() req: AuthenticatedEmployeeRequest,
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

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Zapisuje dokument pracownika w bazie',
    description:
      'Rejestruje w bazie metadane dokumentu wcześniej wgranego do MinIO. fileKey jest zapisywany jako fileUrl.',
  })
  @ApiResponse({
    status: 201,
    description: 'Dokument został przypisany do pracownika.',
    type: EmployeeDocumentSingleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pracownik nie istnieje lub jest nieaktywny.',
  })
  async addDocument(
    @Param('id') id: string,
    @Body() dto: AddEmployeeDocumentDto,
  ) {
    return this.employeesService.addDocument(id, dto);
  }
}
