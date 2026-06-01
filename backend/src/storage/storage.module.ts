import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { AuthModule } from '../auth/auth.module'; // <--- Import modułu autoryzacji

@Module({
  imports: [AuthModule], // <--- Rejestracja AuthModule daje dostęp do JwtService
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
