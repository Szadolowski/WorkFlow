import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d{11}$/)
  pesel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rfidCardId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(500)
  email?: string;
}
