import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCertificationDictionaryDto } from './create-certification-dictionary.dto';

export class UpdateCertificationDictionaryDto extends PartialType(
  CreateCertificationDictionaryDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
