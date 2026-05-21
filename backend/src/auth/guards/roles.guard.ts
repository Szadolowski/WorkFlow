import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '@/auth/guards/jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private getRequestedFacilityId(request: AuthenticatedRequest) {
    const queryFacilityId = request.query?.facilityId as unknown;
    if (typeof queryFacilityId === 'string') {
      return queryFacilityId;
    }

    if (Array.isArray(queryFacilityId) && queryFacilityId[0]) {
      return queryFacilityId[0];
    }

    const bodyFacilityId = (request.body as { facilityId?: unknown })
      ?.facilityId;
    if (typeof bodyFacilityId === 'string') {
      return bodyFacilityId;
    }

    const paramFacilityId = request.params?.facilityId;
    if (typeof paramFacilityId === 'string') {
      return paramFacilityId;
    }

    return undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Brak uprawnień do wykonania tej operacji');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'Zbyt niskie uprawnienia do tego zasobu (RBAC)',
      );
    }

    const requestedFacilityId = this.getRequestedFacilityId(request);

    if (requestedFacilityId && user.role !== UserRole.ADMIN) {
      const allowedFacilities = user.facilityIds ?? [];
      if (!allowedFacilities.includes(requestedFacilityId)) {
        throw new ForbiddenException('Brak dostępu do wybranego zakładu.');
      }
    }

    return true;
  }
}
