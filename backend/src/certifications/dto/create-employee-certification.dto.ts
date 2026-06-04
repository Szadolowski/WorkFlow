import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeCertificationDto {
  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID pozycji ze słownika certyfikacji.',
  })
  @IsUUID('4')
  dictionaryId!: string;

  @ApiProperty({
    example: 'BHP/2026/001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  certificateNumber?: string;

  @ApiProperty({
    example: '2026-06-01',
  })
  @IsDateString()
  @IsNotEmpty()
  issuedAt!: string;

  @ApiProperty({
    example: '2027-06-01',
  })
  @IsDateString()
  @IsNotEmpty()
  expiresAt!: string;

  @ApiProperty({
    example: ['22222222-2222-2222-2222-222222222222'],
    required: false,
    description:
      'Opcjonalne ID dokumentów pracownika do powiązania z certyfikatem.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}
