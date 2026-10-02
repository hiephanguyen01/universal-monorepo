import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";
import { Roles } from "@/modules/auth/presentation/decorators/roles.decorator";
import { JwtAuthGuard } from "@/modules/auth/presentation/guards/jwt-auth.guard";
import { RolesGuard } from "@/modules/auth/presentation/guards/roles.guard";
import type { AuthenticatedUser } from "@/modules/auth/presentation/types/authenticated-user";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "../../application/use-cases/update-current-user.use-case";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateCurrentUser: UpdateCurrentUserUseCase,
  ) {}

  @Get()
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  list(
    @Query()
    query: ListUsersQueryDto,
  ) {
    return this.listUsers.execute({
      page: query.page,
      pageSize: query.pageSize,
    });
  }

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
