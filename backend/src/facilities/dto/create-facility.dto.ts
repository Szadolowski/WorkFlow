import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({
    example: 'Centrala Warszawa',
    description: 'Nazwa zakładu.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;

  @ApiProperty({
    example: 'WAR',
    required: false,
    description: 'Unikalny kod zakładu.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiProperty({
    example: 'ul. Przykładowa 1, Warszawa',
    required: false,
    description: 'Adres zakładu.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
