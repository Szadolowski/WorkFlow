import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  internalCode: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AssignEmployeesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  employeeIds: string[];
}

export class CreateReaderDto {
  @IsString()
  serialNumber: string;

  @IsString()
  @IsOptional()
  locationName?: string;
}
