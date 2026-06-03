import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFacilityDto } from './create-facility.dto';

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
