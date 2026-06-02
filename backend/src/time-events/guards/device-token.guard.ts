import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class DeviceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const expectedToken = process.env.DEVICE_INGEST_TOKEN;

    if (!expectedToken) {
      throw new UnauthorizedException('Brak konfiguracji DEVICE_INGEST_TOKEN.');
    }

    const headerToken = request.header('x-device-token');
    const authHeader = request.header('authorization');

    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;

    const providedToken = headerToken || bearerToken;

    if (!providedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException('Nieprawidłowy token urządzenia.');
    }

    return true;
  }
}
