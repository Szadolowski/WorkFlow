import { ApiProperty } from '@nestjs/swagger';
import { AbsenceType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAbsenceDto {
  @ApiProperty({
    enum: AbsenceType,
    example: AbsenceType.HOLIDAY,
  })
  @IsEnum(AbsenceType)
  type!: AbsenceType;

  @ApiProperty({
    example: '2026-07-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-07-05',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    required: false,
    description: 'Opcjonalny dokument, np. L4.',
  })
  @IsOptional()
  @IsUUID('4')
  documentId?: string;

  @ApiProperty({
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
