import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class ExportPayrollQueryDto {
  @ApiProperty({
    example: 6,
    minimum: 1,
    maximum: 12,
    description: 'Miesiąc raportu płacowego.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({
    example: 2026,
    minimum: 2000,
    maximum: 2100,
    description: 'Rok raportu płacowego.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({
    example: '353c8820-5f50-4efd-a758-9b3164776795',
    description: 'Identyfikator zakładu, dla którego generowany jest raport.',
  })
  @IsUUID('4')
  facilityId!: string;
}
