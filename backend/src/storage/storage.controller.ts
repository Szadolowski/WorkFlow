import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Storage (Pliki)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Tylko zalogowani użytkownicy mogą prosić o linki
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('upload-url')
  @ApiOperation({
    summary: 'Pobiera jednorazowy link do wgrania pliku bezpośrednio do MinIO',
  })
  async getUploadUrl(@Query('fileName') fileName: string) {
    if (!fileName) {
      throw new BadRequestException('Brak parametru fileName');
    }

    // Dodajemy znacznik czasu, żeby pliki o tej samej nazwie się nie nadpisywały
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileKey = `${Date.now()}-${sanitizedName}`;

    // Generujemy link ważny przez 1 godzinę (3600 sekund)
    const url = await this.storageService.getPresignedUploadUrl(
      uniqueFileKey,
      3600,
    );

    return {
      url, // Ten link frontend użyje do zrobienia PUT z plikiem
      fileKey: uniqueFileKey, // Tę nazwę frontend wyśle nam potem, żeby zapisać ją w bazie danych
    };
  }
}
