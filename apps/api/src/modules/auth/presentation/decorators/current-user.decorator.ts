// apps/api/src/modules/auth/presentation/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AuthenticatedUser } from "../types/authenticated-user";

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
