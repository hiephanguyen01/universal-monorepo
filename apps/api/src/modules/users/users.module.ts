// apps/api/src/modules/users/users.module.ts

import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";

import { USER_REPOSITORY } from "./users.tokens";

import type { UserRepository } from "./domain/repositories/user.repository";

import { UsersPersistenceModule } from "./infrastructure/users-persistence.module";

import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";

import { UsersController } from "./presentation/controllers/users.controller";

@Module({
  imports: [UsersPersistenceModule, AuthModule],

  controllers: [UsersController],

  providers: [
    {
      provide: GetCurrentUserUseCase,

      inject: [USER_REPOSITORY],

      useFactory: (users: UserRepository) => new GetCurrentUserUseCase(users),
    },
  ],
})
export class UsersModule {}
