import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class EmployeeResponseDto {
  @ApiProperty({
    example: '0f3c3e6d-7b2f-4d4a-8c1e-8a7f9c5a2f11',
    description: 'Unikalny identyfikator pracownika.',
  })
  id!: string;

  @ApiProperty({
    example: 'Jan',
    description: 'Imię pracownika.',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Kowalski',
    description: 'Nazwisko pracownika.',
  })
  lastName!: string;

  @ApiProperty({
    example: '02070803628',
    description: 'Numer PESEL pracownika.',
  })
  pesel!: string | null;

  @ApiProperty({
    example: 'jan.kowalski@example.com',
    description: 'Adres e-mail pracownika.',
  })
  email!: string | null;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.WORKER,
    description:
      'Rola systemowa pracownika. Przy zwykłym tworzeniu pracownika domyślnie WORKER.',
  })
  role!: UserRole;

  @ApiProperty({
    example: true,
    description: 'Czy pracownik jest aktywny w ewidencji.',
  })
  isActive!: boolean;

  @ApiProperty({
    example: false,
    description: 'Czy pracownik ma aktywne konto logowania do systemu.',
  })
  isLoginEnabled!: boolean;

  @ApiProperty({
    example: '2026-06-01T12:00:00.000Z',
    description: 'Data utworzenia rekordu pracownika.',
  })
  createdAt!: Date;
}

export class EmployeeSingleResponseDto {
  @ApiProperty({
    type: EmployeeResponseDto,
    description: 'Dane utworzonego pracownika.',
  })
  data!: EmployeeResponseDto;
}
