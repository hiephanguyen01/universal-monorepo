import { Module } from "@nestjs/common";
import { AuthModule } from "@/modules/auth/auth.module";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { UpdateCurrentUserUseCase } from "./application/use-cases/update-current-user.use-case";
import type { UserRepository } from "./domain/repositories/user.repository";
import { UsersPersistenceModule } from "./infrastructure/users-persistence.module";
import { UsersController } from "./presentation/controllers/users.controller";
import { USER_REPOSITORY } from "./users.tokens";

@Module({
  imports: [
    UsersPersistenceModule,
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) =>
        new GetCurrentUserUseCase(users),
    },
    {
      provide: UpdateCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) =>
        new UpdateCurrentUserUseCase(users),
    },
  ],
})
export class UsersModule {}
