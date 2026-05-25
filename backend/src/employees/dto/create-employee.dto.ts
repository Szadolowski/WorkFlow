import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsPesel } from '@/common/validators/is-pesel.validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  @IsPesel({ message: 'Niepoprawny numer PESEL' })
  pesel!: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Niepoprawny format adresu e-mail' })
  email!: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Niepoprawna rola użytkownika' })
  role!: UserRole;
}
