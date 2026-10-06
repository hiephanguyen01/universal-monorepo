import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";

import { PERMISSIONS } from "@/modules/auth/authorization/permissions";
import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";
import { Permissions } from "@/modules/auth/presentation/decorators/permissions.decorator";
import { JwtAuthGuard } from "@/modules/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/presentation/guards/permissions.guard";
import type { AuthenticatedUser } from "@/modules/auth/presentation/types/authenticated-user";

import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "../../application/use-cases/update-current-user.use-case";
import { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @Inject(GetCurrentUserUseCase)
    private readonly getCurrentUser:
      GetCurrentUserUseCase,

    @Inject(ListUsersUseCase)
    private readonly listUsers:
      ListUsersUseCase,

    @Inject(UpdateCurrentUserUseCase)
    private readonly updateCurrentUser:
      UpdateCurrentUserUseCase,

    @Inject(UpdateUserProfileUseCase)
    private readonly updateUserProfile:
      UpdateUserProfileUseCase,
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
    return this.getCurrentUser.execute(
      user.id,
    );
  }

  @Patch("me")
  updateMe(
    @CurrentUser()
    user: AuthenticatedUser,

    @Headers("idempotency-key")
    idempotencyKey:
      string | undefined,

    @Body()
    dto: UpdateProfileDto,
  ) {
    const key =
      idempotencyKey?.trim();

    return this.updateCurrentUser.execute(
      user.id,
      {
        fullName:
          dto.fullName,
        version:
          dto.version,
      },
      key && key.length <= 200
        ? key
        : undefined,
    );
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
        id:
          actor.id,
        role:
          actor.role,
      },
      userId,
      {
        fullName:
          dto.fullName,
        version:
          dto.version,
      },
    );
  }
}
