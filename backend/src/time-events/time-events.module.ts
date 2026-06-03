import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { TimeEventsController } from './time-events.controller';
import { TimeEventsService } from './time-events.service';
import { DeviceTokenGuard } from './guards/device-token.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TimeEventsController],
  providers: [TimeEventsService, DeviceTokenGuard],
  exports: [TimeEventsService],
})
export class TimeEventsModule {}
