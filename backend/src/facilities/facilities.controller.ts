import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { UpdateFacilityEmployeesDto } from './dto/update-facility-employees.dto';

@ApiTags('Facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Pobiera listę zakładów',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista zakładów.',
  })
  findAll() {
    return this.facilitiesService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Dodaje nowy zakład',
  })
  @ApiResponse({
    status: 201,
    description: 'Zakład został utworzony.',
  })
  @ApiResponse({
    status: 409,
    description: 'Kod zakładu jest już zajęty.',
  })
  create(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Aktualizuje dane zakładu',
  })
  @ApiResponse({
    status: 200,
    description: 'Zakład został zaktualizowany.',
  })
  @ApiResponse({
    status: 404,
    description: 'Zakład nie istnieje.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id/employees')
  @ApiOperation({
    summary: 'Pobiera pracowników przypisanych do zakładu',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista pracowników wraz z informacją o dostępie do zakładu.',
  })
  findEmployees(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.facilitiesService.findEmployees(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/employees')
  @ApiOperation({
    summary: 'Aktualizuje przypisanie pracowników do zakładu',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista przypisań została zaktualizowana.',
  })
  updateEmployees(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFacilityEmployeesDto,
  ) {
    return this.facilitiesService.updateEmployees(id, dto.employeeIds);
  }
}
