import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module'; // Ścieżka zależna od Twojej struktury
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService], // Opcjonalnie: eksportujemy serwis, jeśli inny moduł będzie go potrzebował
})
export class ProjectsModule {}
