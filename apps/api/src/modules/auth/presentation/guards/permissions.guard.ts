import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

import { ROLE_PERMISSIONS } from "../../authorization/permissions";

import type { Permission } from "../../authorization/permissions";

import type { AuthenticatedUser } from "../types/authenticated-user";

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      readonly Permission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authenticated user is required");
    }

    const userPermissions = ROLE_PERMISSIONS[user.role];

    const allowed = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException("Insufficient permission");
    }

    return true;
  }
}
