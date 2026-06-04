import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
