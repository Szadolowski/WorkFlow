import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAbsenceApprovalDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isApproved!: boolean;
}
