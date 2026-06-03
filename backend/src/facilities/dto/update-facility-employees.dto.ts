import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateFacilityEmployeesDto {
  @ApiProperty({
    example: [
      'd37aba11-a5ca-4e97-b821-a1009fe66ecd',
      'c0a0ebae-c34d-4e67-9dd7-2c7b60dd349f',
    ],
    description:
      'Lista pracowników, którzy mają mieć dostęp do wybranego zakładu.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  employeeIds!: string[];
}
