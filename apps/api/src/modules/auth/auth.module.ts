import { CommonModule } from "@/common/common.module";
import { CLOCK, ID_GENERATOR } from "@/common/common.tokens";
import type { Clock } from "@/common/ports/clock.port";
import type { IdGenerator } from "@/common/ports/id-generator.port";
import { PrismaModule } from "@/infrastructure/prisma/prisma.module";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";
import { UsersPersistenceModule } from "@/modules/users/infrastructure/users-persistence.module";
import { USER_REPOSITORY } from "@/modules/users/users.tokens";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { PasswordHasher } from "./application/ports/password-hasher.port";
import type { RefreshTokenRepository } from "./application/ports/refresh-token.repository";
import type { RegistrationUnitOfWork } from "./application/ports/registration-unit-of-work.port";
import type { TokenService } from "./application/ports/token-service.port";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.use-case";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  REGISTRATION_UNIT_OF_WORK,
  TOKEN_SERVICE,
} from "./auth.tokens";
import { PrismaRefreshTokenRepository } from "./infrastructure/persistence/prisma-refresh-token.repository";
import { PrismaRegistrationUnitOfWork } from "./infrastructure/persistence/prisma-registration-unit-of-work";
import { ArgonPasswordHasher } from "./infrastructure/security/argon-password-hasher";
import { JwtTokenService } from "./infrastructure/security/jwt-token.service";
import { AuthController } from "./presentation/controllers/auth.controller";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "./presentation/guards/permissions.guard";
import { RolesGuard } from "./presentation/guards/roles.guard";

@Module({
  imports: [
    CommonModule,
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
      provide: REGISTRATION_UNIT_OF_WORK,
      useClass: PrismaRegistrationUnitOfWork,
    },
    {
      provide: RegisterUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
        REGISTRATION_UNIT_OF_WORK,
        ID_GENERATOR,
        CLOCK,
      ],
      useFactory: (
        users: UserRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
        registrationUnitOfWork: RegistrationUnitOfWork,
        idGenerator: IdGenerator,
        clock: Clock,
      ) =>
        new RegisterUseCase(
          users,
          passwordHasher,
          tokenService,
          registrationUnitOfWork,
          idGenerator,
          clock,
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
      ) => new LoginUseCase(users, passwordHasher, tokenService, refreshTokens),
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
      inject: [TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY],
      useFactory: (
        tokenService: TokenService,
        refreshTokens: RefreshTokenRepository,
      ) => new LogoutUseCase(tokenService, refreshTokens),
    },
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
