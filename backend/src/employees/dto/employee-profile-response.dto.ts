import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserRole,
  ContractType,
  ProjectStatus,
  CertificationType,
} from '@prisma/client';

class ProfileProjectDto {
  @ApiProperty({ description: 'UUID projektu' })
  id!: string;

  @ApiProperty({ description: 'Nazwa budowy/projektu' })
  name!: string;

  @ApiPropertyOptional({ description: 'Wewnętrzny kod projektu' })
  internalCode!: string | null;

  @ApiProperty({ enum: ProjectStatus, description: 'Obecny status projektu' })
  status!: ProjectStatus;
}

class ProfileActiveAssignmentDto {
  @ApiProperty({ description: 'UUID przypisania' })
  id!: string;

  @ApiProperty({ description: 'Data przypisania pracownika do budowy' })
  assignedAt!: Date;

  @ApiPropertyOptional({ description: 'Dodatkowe notatki dyspozytora' })
  notes!: string | null;

  @ApiProperty({ type: ProfileProjectDto, description: 'Szczegóły projektu' })
  project!: ProfileProjectDto;
}

class ProfileCurrentContractDto {
  @ApiProperty({ description: 'UUID umowy' })
  id!: string;

  @ApiProperty({ enum: ContractType, description: 'Rodzaj umowy' })
  type!: ContractType;

  @ApiProperty({ description: 'Kwota wynagrodzenia', type: Number })
  salaryAmount!: number;

  @ApiProperty({ description: 'Data rozpoczęcia umowy' })
  startDate!: Date;

  @ApiPropertyOptional({
    description: 'Data zakończenia umowy (jeśli dotyczy)',
  })
  endDate!: Date | null;
}

class ProfileCertificationDictionaryDto {
  @ApiProperty({ description: 'UUID słownika uprawnień' })
  id!: string;

  @ApiProperty({ enum: CertificationType, description: 'Typ uprawnienia' })
  type!: CertificationType;

  @ApiProperty({ description: 'Nazwa uprawnienia' })
  name!: string;
}

class ProfileValidCertificationDto {
  @ApiProperty({ description: 'UUID wpisu uprawnienia pracownika' })
  id!: string;

  @ApiPropertyOptional({ description: 'Numer certyfikatu' })
  certificateNumber!: string | null;

  @ApiProperty({ description: 'Data wydania' })
  issuedAt!: Date;

  @ApiProperty({ description: 'Data wygaśnięcia uprawnienia' })
  expiresAt!: Date;

  @ApiProperty({
    type: ProfileCertificationDictionaryDto,
    description: 'Szczegóły słownikowe uprawnienia',
  })
  dictionary!: ProfileCertificationDictionaryDto;
}

export class EmployeeProfileDto {
  @ApiProperty({ description: 'UUID pracownika' })
  id!: string;

  @ApiProperty({ description: 'Imię' })
  firstName!: string;

  @ApiProperty({ description: 'Nazwisko' })
  lastName!: string;

  @ApiPropertyOptional({ description: 'Numer PESEL' })
  pesel!: string | null;

  @ApiPropertyOptional({ description: 'ID karty RFID' })
  rfidCardId!: string | null;

  @ApiPropertyOptional({ description: 'Adres e-mail' })
  email!: string | null;

  @ApiProperty({ enum: UserRole, description: 'Rola w systemie' })
  role!: UserRole;

  @ApiProperty({ description: 'Czy pracownik jest aktywny (Soft Delete)' })
  isActive!: boolean;

  @ApiProperty({ description: 'Czy ma włączone logowanie' })
  isLoginEnabled!: boolean;

  @ApiProperty({ description: 'Czy ma skonfigurowane 2FA' })
  isTwoFactorEnabled!: boolean;

  @ApiProperty({ description: 'Data utworzenia profilu' })
  createdAt!: Date;

  @ApiPropertyOptional({
    type: ProfileCurrentContractDto,
    description: 'Aktualna umowa (isCurrent = true)',
  })
  currentContract!: ProfileCurrentContractDto | null;

  @ApiProperty({
    type: [ProfileActiveAssignmentDto],
    description: 'Lista trwających przypisań do projektów',
  })
  activeAssignments!: ProfileActiveAssignmentDto[];

  @ApiProperty({
    type: [ProfileValidCertificationDto],
    description: 'Ważne uprawnienia i szkolenia',
  })
  validCertifications!: ProfileValidCertificationDto[];
}

export class EmployeeProfileResponseDto {
  @ApiProperty({
    type: EmployeeProfileDto,
    description: 'Zgregowane dane profilowe pracownika',
  })
  data!: EmployeeProfileDto;
}
