import { ApiProperty } from '@nestjs/swagger';

export class EmployeeDocumentResponseDto {
  @ApiProperty({
    example: '2e7c01f5-1c24-45aa-b35f-2b9dc9b5e8d1',
    description: 'Unikalny identyfikator dokumentu.',
  })
  id!: string;

  @ApiProperty({
    example: '0f3c3e6d-7b2f-4d4a-8c1e-8a7f9c5a2f11',
    description: 'Identyfikator pracownika, do którego przypisano dokument.',
  })
  employeeId!: string;

  @ApiProperty({
    example: 'umowa-o-prace-jan-kowalski.pdf',
    description: 'Nazwa pliku dokumentu.',
  })
  fileName!: string;

  @ApiProperty({
    example:
      'employees/0f3c3e6d-7b2f-4d4a-8c1e-8a7f9c5a2f11/documents/uuid.pdf',
    description: 'Klucz pliku w MinIO zapisany w polu fileUrl.',
  })
  fileUrl!: string;

  @ApiProperty({
    example: '2026-06-02T08:00:00.000Z',
    description: 'Data dodania dokumentu.',
  })
  createdAt!: Date;
}

export class EmployeeDocumentSingleResponseDto {
  @ApiProperty({
    type: EmployeeDocumentResponseDto,
    description: 'Dane dodanego dokumentu.',
  })
  data!: EmployeeDocumentResponseDto;
}
