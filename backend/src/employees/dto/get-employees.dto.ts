import {
  IsOptional,
  IsEnum,
  IsBooleanString,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class GetEmployeesDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsUUID('4')
  facilityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
