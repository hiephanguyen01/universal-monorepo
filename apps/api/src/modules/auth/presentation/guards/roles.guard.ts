import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ROLES_KEY,
} from "../decorators/roles.decorator";
import type {
  AuthenticatedRole,
  AuthenticatedUser,
} from "../types/authenticated-user";

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector:
      Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<
        AuthenticatedRole[]
      >(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const user =
      request.user;

    if (!user) {
      throw new ForbiddenException(
        "Authenticated user is required",
      );
    }

    if (
      !requiredRoles.includes(
        user.role,
      )
    ) {
      throw new ForbiddenException(
        "Insufficient role",
      );
    }

    return true;
  }
}
