import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  @Length(11, 11, { message: 'PESEL musi mieć dokładnie 11 znaków' })
  pesel!: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Niepoprawny format adresu e-mail' })
  email!: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Niepoprawna rola użytkownika' })
  role!: UserRole;
}
