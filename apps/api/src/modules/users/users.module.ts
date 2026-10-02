import { Module } from "@nestjs/common";
import { AuthModule } from "@/modules/auth/auth.module";
import { USER_REPOSITORY } from "@/modules/users/domain/user";
import {
  GetCurrentUserUseCase,
  UpdateCurrentUserUseCase,
} from "@/modules/users/application/user.use-cases";
import { UsersController } from "@/modules/users/presentation/users.controller";

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (u: any) => new GetCurrentUserUseCase(u),
    },
    {
      provide: UpdateCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (u: any) => new UpdateCurrentUserUseCase(u),
    },
  ],
})
export class UsersModule {}
