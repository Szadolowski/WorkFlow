import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimeEventsService } from './time-events.service';
import { DeviceTimeEventDto } from './dto/device-time-event.dto';
import { DeviceTokenGuard } from './guards/device-token.guard';

@ApiTags('Time Events')
@Controller('time-events')
export class TimeEventsController {
  constructor(private readonly timeEventsService: TimeEventsService) {}

  @Post('device')
  @UseGuards(DeviceTokenGuard)
  @ApiHeader({
    name: 'x-device-token',
    required: true,
    description: 'Token techniczny urządzenia / czytnika.',
  })
  @ApiOperation({
    summary: 'Przyjmuje zdarzenie czasu pracy z urządzenia',
    description:
      'Zapisuje surowe zdarzenie IN/OUT z czytnika. Przy zdarzeniu OUT próbuje utworzyć TimeEntry ze statusem PENDING.',
  })
  @ApiResponse({
    status: 201,
    description: 'Zdarzenie zostało zapisane.',
  })
  @ApiResponse({
    status: 400,
    description: 'Nieprawidłowe dane zdarzenia.',
  })
  @ApiResponse({
    status: 401,
    description: 'Brak lub nieprawidłowy token urządzenia.',
  })
  @ApiResponse({
    status: 403,
    description: 'Pracownik nie ma dostępu do zakładu czytnika.',
  })
  @ApiResponse({
    status: 404,
    description: 'Nie znaleziono czytnika lub pracownika.',
  })
  ingestDeviceEvent(@Body() dto: DeviceTimeEventDto) {
    return this.timeEventsService.ingestDeviceEvent(dto);
  }
}
