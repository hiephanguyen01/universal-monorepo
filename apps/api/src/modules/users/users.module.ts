import { Module } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";
import { CLOCK } from "@/common/common.tokens";
import type { Clock } from "@/common/ports/clock.port";
import type { IdempotencyRepository } from "@/common/ports/idempotency-repository.port";
import type { PayloadHasher } from "@/common/ports/payload-hasher.port";
import { IdempotencyModule } from "@/infrastructure/idempotency/idempotency.module";
import {
  IDEMPOTENCY_REPOSITORY,
  PAYLOAD_HASHER,
} from "@/infrastructure/idempotency/idempotency.tokens";
import { AuthModule } from "@/modules/auth/auth.module";

import type { CurrentUserUpdateUnitOfWork } from "./application/ports/current-user-update-unit-of-work.port";
import { UserAccessPolicy } from "./application/policies/user-access.policy";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "./application/use-cases/update-current-user.use-case";
import { UpdateUserProfileUseCase } from "./application/use-cases/update-user-profile.use-case";
import type { UserRepository } from "./domain/repositories/user.repository";
import { UsersPersistenceModule } from "./infrastructure/users-persistence.module";
import { UsersController } from "./presentation/controllers/users.controller";
import {
  CURRENT_USER_UPDATE_UNIT_OF_WORK,
  USER_REPOSITORY,
} from "./users.tokens";

@Module({
  imports: [
    CommonModule,
    UsersPersistenceModule,
    IdempotencyModule,
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    UserAccessPolicy,
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (
        users: UserRepository,
      ) =>
        new GetCurrentUserUseCase(
          users,
        ),
    },
    {
      provide: ListUsersUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (
        users: UserRepository,
      ) =>
        new ListUsersUseCase(
          users,
        ),
    },
    {
      provide: UpdateCurrentUserUseCase,
      inject: [
        USER_REPOSITORY,
        CLOCK,
        IDEMPOTENCY_REPOSITORY,
        PAYLOAD_HASHER,
        CURRENT_USER_UPDATE_UNIT_OF_WORK,
      ],
      useFactory: (
        users: UserRepository,
        clock: Clock,
        idempotency:
          IdempotencyRepository,
        payloadHasher:
          PayloadHasher,
        unitOfWork:
          CurrentUserUpdateUnitOfWork,
      ) =>
        new UpdateCurrentUserUseCase(
          users,
          clock,
          idempotency,
          payloadHasher,
          unitOfWork,
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
        accessPolicy:
          UserAccessPolicy,
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
