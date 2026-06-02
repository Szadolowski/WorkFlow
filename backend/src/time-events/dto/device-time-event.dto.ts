import { ApiProperty } from '@nestjs/swagger';
import { TimeEventAction } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DeviceTimeEventDto {
  @ApiProperty({
    example: 'RFID-R-1001',
    description: 'Numer seryjny czytnika / urządzenia.',
  })
  @IsString()
  @IsNotEmpty()
  readerSerialNumber!: string;

  @ApiProperty({
    example: 'CARD-000123',
    description: 'Identyfikator karty RFID pracownika.',
  })
  @IsString()
  @IsNotEmpty()
  rfidCardId!: string;

  @ApiProperty({
    enum: TimeEventAction,
    example: TimeEventAction.IN,
    description: 'Typ zdarzenia z czytnika.',
  })
  @IsEnum(TimeEventAction)
  action!: TimeEventAction;

  @ApiProperty({
    example: '2026-03-12T07:00:00.000Z',
    description: 'Czas zdarzenia z urządzenia.',
  })
  @IsDateString()
  eventTime!: string;

  @ApiProperty({
    example: 'RFID-R-1001-20260312-000001',
    required: false,
    description:
      'Opcjonalny zewnętrzny identyfikator zdarzenia. Docelowo można użyć go do ochrony przed duplikatami.',
  })
  @IsOptional()
  @IsString()
  externalEventId?: string;
}
