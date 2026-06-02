import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class UpdateEmployeeAccessDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.FOREMAN,
    description:
      'Rola systemowa nadawana pracownikowi podczas aktywacji dostępu.',
  })
  @IsEnum(UserRole, { message: 'Niepoprawna rola użytkownika' })
  role!: UserRole;

  @ApiProperty({
    example: 'Tymczasowe123!',
    minLength: 8,
    description:
      'Hasło tymczasowe ustawiane przez administratora. Nie jest zwracane w odpowiedzi API.',
  })
  @IsString()
  @MinLength(8, { message: 'Hasło tymczasowe musi mieć co najmniej 8 znaków' })
  temporaryPassword!: string;
}
