import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees/:employeeId/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Get()
  @ApiOperation({
    summary: 'Pobiera historię umów pracownika',
  })
  @ApiResponse({
    status: 200,
    description: 'Historia umów pracownika.',
  })
  findByEmployee(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.contractsService.findByEmployee(
      employeeId,
      req.user,
      facilityId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.HR)
  @Post()
  @ApiOperation({
    summary: 'Dodaje nową aktualną umowę pracownika',
    description:
      'Utworzenie nowej umowy zamyka poprzednie aktualne umowy pracownika.',
  })
  @ApiResponse({
    status: 201,
    description: 'Umowa została dodana.',
  })
  create(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: CreateContractDto,
    @Req() req: AuthenticatedRequest,
    @Query('facilityId') facilityId: string | undefined,
  ) {
    return this.contractsService.create(employeeId, dto, req.user, facilityId);
  }
}
