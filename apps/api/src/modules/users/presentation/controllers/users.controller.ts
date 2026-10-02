import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";
import { Permissions } from "@/modules/auth/presentation/decorators/permissions.decorator";
import { JwtAuthGuard } from "@/modules/auth/presentation/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "@/modules/auth/presentation/types/authenticated-user";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "../../application/use-cases/update-current-user.use-case";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";

import { PermissionsGuard } from "@/modules/auth/presentation/guards/permissions.guard";

import { PERMISSIONS } from "@/modules/auth/authorization/permissions";
import { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateCurrentUser: UpdateCurrentUserUseCase,
    private readonly updateUserProfile: UpdateUserProfileUseCase,
  ) {}

  @Get()
  @Permissions([PERMISSIONS.USERS_READ])
  @UseGuards(PermissionsGuard)
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

  @Patch(":id")
  updateById(
    @CurrentUser()
    actor: AuthenticatedUser,

    @Param("id")
    userId: string,

    @Body()
    dto: UpdateProfileDto,
  ) {
    return this.updateUserProfile.execute(
      {
        id: actor.id,
        role: actor.role,
      },

      userId,

      {
        fullName: dto.fullName,
      },
    );
  }
}
