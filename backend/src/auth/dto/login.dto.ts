import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Niepoprawny format adresu email' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Hasło musi mieć minimum 8 znaków' })
  password!: string;
}
