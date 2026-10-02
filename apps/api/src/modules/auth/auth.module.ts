import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "@/infrastructure/prisma/prisma.module";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";
import { UsersPersistenceModule } from "@/modules/users/infrastructure/users-persistence.module";
import { USER_REPOSITORY } from "@/modules/users/users.tokens";
import type { PasswordHasher } from "./application/ports/password-hasher.port";
import type { RefreshTokenRepository } from "./application/ports/refresh-token.repository";
import type { TokenService } from "./application/ports/token-service.port";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.use-case";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
} from "./auth.tokens";
import { PrismaRefreshTokenRepository } from "./infrastructure/persistence/prisma-refresh-token.repository";
import { ArgonPasswordHasher } from "./infrastructure/security/argon-password-hasher";
import { JwtTokenService } from "./infrastructure/security/jwt-token.service";
import { AuthController } from "./presentation/controllers/auth.controller";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard";
import { RolesGuard } from "./presentation/guards/roles.guard";

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule,
    UsersPersistenceModule,
  ],
  controllers: [AuthController],
  providers: [
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
      provide: RegisterUseCase,
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
      ) =>
        new RegisterUseCase(
          users,
          passwordHasher,
          tokenService,
          refreshTokens,
        ),
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
      ) =>
        new LoginUseCase(
          users,
          passwordHasher,
          tokenService,
          refreshTokens,
        ),
    },
    {
      provide: RefreshTokenUseCase,
      inject: [
        USER_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
      ],
      useFactory: (
        users: UserRepository,
        refreshTokens: RefreshTokenRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
      ) =>
        new RefreshTokenUseCase(
          users,
          refreshTokens,
          passwordHasher,
          tokenService,
        ),
    },
    {
      provide: LogoutUseCase,
      inject: [
        TOKEN_SERVICE,
        REFRESH_TOKEN_REPOSITORY,
      ],
      useFactory: (
        tokenService: TokenService,
        refreshTokens: RefreshTokenRepository,
      ) =>
        new LogoutUseCase(
          tokenService,
          refreshTokens,
        ),
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
