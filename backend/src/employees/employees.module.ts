import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Upewnij się, że ścieżka do Prismy jest zgodna z Twoim projektem
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule], // Potrzebujemy Prismy do operacji na bazie
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
