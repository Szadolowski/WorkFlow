import { ApiProperty } from '@nestjs/swagger';
import { CertificationType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCertificationDictionaryDto {
  @ApiProperty({
    enum: CertificationType,
    example: CertificationType.BHP,
  })
  @IsEnum(CertificationType)
  type!: CertificationType;

  @ApiProperty({
    example: 'Szkolenie BHP podstawowe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;

  @ApiProperty({
    example: 'Podstawowe szkolenie BHP dla nowych pracowników.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 12,
    required: false,
    description: 'Domyślna ważność w miesiącach.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultValidityMonths?: number;
}
