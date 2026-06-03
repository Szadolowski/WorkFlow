import { ApiProperty } from '@nestjs/swagger';
import { TimeEntryStatus } from '@prisma/client';
import { IsEnum, IsIn } from 'class-validator';

export class UpdateTimeEntryStatusDto {
  @ApiProperty({
    enum: [TimeEntryStatus.APPROVED, TimeEntryStatus.REJECTED],
    example: TimeEntryStatus.APPROVED,
    description: 'Nowy status wpisu czasu pracy.',
  })
  @IsEnum(TimeEntryStatus)
  @IsIn([TimeEntryStatus.APPROVED, TimeEntryStatus.REJECTED])
  status!: TimeEntryStatus;
}
