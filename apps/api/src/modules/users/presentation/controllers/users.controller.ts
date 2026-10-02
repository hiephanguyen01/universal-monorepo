// apps/api/src/modules/users/presentation/controllers/users.controller.ts

import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "@/modules/auth/presentation/guards/jwt-auth.guard";

import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";

import type { AuthenticatedUser } from "@/modules/auth/presentation/types/authenticated-user";

import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";

@Controller("users")
export class UsersController {
  constructor(private readonly getCurrentUser: GetCurrentUserUseCase) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.getCurrentUser.execute(user.id);
  }
}
