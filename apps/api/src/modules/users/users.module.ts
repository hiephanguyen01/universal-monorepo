import { AuthModule } from "@/modules/auth/auth.module";
import { Module } from "@nestjs/common";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "./application/use-cases/update-current-user.use-case";
import type { UserRepository } from "./domain/repositories/user.repository";
import { UsersPersistenceModule } from "./infrastructure/users-persistence.module";
import { UsersController } from "./presentation/controllers/users.controller";
import { USER_REPOSITORY } from "./users.tokens";
import { UserAccessPolicy } from "../auth/application/policies/user-access.policy";
import { UpdateUserProfileUseCase } from "./application/use-cases/update-user-profile.use-case";

@Module({
  imports: [UsersPersistenceModule, AuthModule],
  controllers: [UsersController],
  providers: [
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new GetCurrentUserUseCase(users),
    },
    {
      provide: ListUsersUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new ListUsersUseCase(users),
    },
    {
      provide: UpdateCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) =>
        new UpdateCurrentUserUseCase(users),
    },
    {
      provide: UpdateUserProfileUseCase,

      inject: [USER_REPOSITORY, UserAccessPolicy],

      useFactory: (
        users: UserRepository,

        accessPolicy: UserAccessPolicy,
      ) => new UpdateUserProfileUseCase(users, accessPolicy),
    },
  ],
})
export class UsersModule {}
