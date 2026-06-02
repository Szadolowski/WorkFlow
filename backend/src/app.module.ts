import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { EmployeesModule } from './employees/employees.module';
import { ProjectsModule } from './projects/projects.module';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StorageModule } from './storage/storage.module';
import { PayrollModule } from './payroll/payroll.module';
import { TimeEventsModule } from './time-events/time-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    ProjectsModule,
    DashboardModule,
    StorageModule,
    PayrollModule,
    TimeEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
