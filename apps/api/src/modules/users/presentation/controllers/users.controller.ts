import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/modules/auth/presentation/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "@/modules/auth/presentation/types/authenticated-user";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { UpdateCurrentUserUseCase } from "../../application/use-cases/update-current-user.use-case";
import { UpdateProfileDto } from "../dto/update-profile.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly updateCurrentUser: UpdateCurrentUserUseCase,
  ) {}

  @Get("me")
  getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.getCurrentUser.execute(user.id);
  }

  @Patch("me")
  updateMe(
    @CurrentUser()
    user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateCurrentUser.execute(user.id, {
      fullName: dto.fullName,
    });
  }
}
