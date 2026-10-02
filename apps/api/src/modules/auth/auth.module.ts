import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import type { PasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import type { RefreshTokenRepository } from "@/modules/auth/application/ports/refresh-token.repository";
import type { TokenService } from "@/modules/auth/application/ports/token-service.port";
import { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";
import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
} from "@/modules/auth/auth.tokens";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/persistence/prisma-refresh-token.repository";
import { ArgonPasswordHasher } from "@/modules/auth/infrastructure/security/argon-password-hasher";
import { JwtTokenService } from "@/modules/auth/infrastructure/security/jwt-token.service";
import { AuthController } from "@/modules/auth/presentation/controllers/auth.controller";
import { JwtAuthGuard } from "@/modules/auth/presentation/jwt-auth.guard";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "@/modules/users/domain/user";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prisma-user.repository";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: ArgonPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: LoginUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
        REFRESH_TOKEN_REPOSITORY,
      ],
      useFactory: (
        users: UserRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
        refreshTokens: RefreshTokenRepository,
      ) => {
        return new LoginUseCase(
          users,
          passwordHasher,
          tokenService,
          refreshTokens,
        );
      },
    },
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, TOKEN_SERVICE, USER_REPOSITORY, PrismaService],
})
export class AuthModule {}
