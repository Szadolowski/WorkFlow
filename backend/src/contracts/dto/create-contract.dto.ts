import { ApiProperty } from '@nestjs/swagger';
import { ContractType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @ApiProperty({
    enum: ContractType,
    example: ContractType.UOP,
    description: 'Typ umowy pracownika.',
  })
  @IsEnum(ContractType)
  type!: ContractType;

  @ApiProperty({
    example: 7234,
    description: 'Dla UOP/UD: kwota okresowa. Dla UZ/B2B: stawka godzinowa.',
  })
  @IsNumber()
  @Min(0)
  salaryAmount!: number;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Data rozpoczęcia obowiązywania umowy.',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    example: '2026-12-31',
    required: false,
    description: 'Opcjonalna data zakończenia umowy.',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
