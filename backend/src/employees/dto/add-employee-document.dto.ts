import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddEmployeeDocumentDto {
  @ApiProperty({
    example: 'umowa-o-prace-jan-kowalski.pdf',
    description: 'Oryginalna lub prezentacyjna nazwa pliku dokumentu.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileName!: string;

  @ApiProperty({
    example:
      'employees/0f3c3e6d-7b2f-4d4a-8c1e-8a7f9c5a2f11/documents/uuid.pdf',
    description:
      'Klucz pliku w storage MinIO. W bazie zapisywany jest w polu fileUrl.',
  })
  @IsString()
  @IsNotEmpty()
  fileKey!: string;
}
