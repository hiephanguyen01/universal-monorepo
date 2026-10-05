import { CommonModule } from "@/common/common.module";
import { CLOCK } from "@/common/common.tokens";
import type { Clock } from "@/common/ports/clock.port";
import { AuthModule } from "@/modules/auth/auth.module";
import { Module } from "@nestjs/common";
import { UserAccessPolicy } from "./application/policies/user-access.policy";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "./application/use-cases/update-current-user.use-case";
import { UpdateUserProfileUseCase } from "./application/use-cases/update-user-profile.use-case";
import type { UserRepository } from "./domain/repositories/user.repository";
import { UsersPersistenceModule } from "./infrastructure/users-persistence.module";
import { UsersController } from "./presentation/controllers/users.controller";
import { USER_REPOSITORY } from "./users.tokens";

@Module({
  imports: [
    CommonModule,
    UsersPersistenceModule,
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    UserAccessPolicy,
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) =>
        new GetCurrentUserUseCase(users),
    },
    {
      provide: ListUsersUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) =>
        new ListUsersUseCase(users),
    },
    {
      provide: UpdateCurrentUserUseCase,
      inject: [USER_REPOSITORY, CLOCK],
      useFactory: (
        users: UserRepository,
        clock: Clock,
      ) =>
        new UpdateCurrentUserUseCase(
          users,
          clock,
        ),
    },
    {
      provide: UpdateUserProfileUseCase,
      inject: [
        USER_REPOSITORY,
        UserAccessPolicy,
        CLOCK,
      ],
      useFactory: (
        users: UserRepository,
        accessPolicy: UserAccessPolicy,
        clock: Clock,
      ) =>
        new UpdateUserProfileUseCase(
          users,
          accessPolicy,
          clock,
        ),
    },
  ],
})
export class UsersModule {}
