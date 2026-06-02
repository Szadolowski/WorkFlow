import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsPesel } from '@/common/validators/is-pesel.validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Jan',
    description: 'Imię pracownika dodawanego do ewidencji kadrowej.',
  })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: 'Kowalski',
    description: 'Nazwisko pracownika dodawanego do ewidencji kadrowej.',
  })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: '02070803628',
    description:
      'Numer PESEL pracownika. Musi przejść walidację sumy kontrolnej.',
  })
  @IsNotEmpty()
  @IsString()
  @IsPesel({ message: 'Niepoprawny numer PESEL' })
  pesel!: string;

  @ApiProperty({
    example: 'jan.kowalski@example.com',
    description:
      'Adres e-mail pracownika. Na tym etapie nie aktywuje jeszcze konta logowania.',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Niepoprawny format adresu e-mail' })
  email!: string;
}
