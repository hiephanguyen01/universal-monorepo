// apps/api/src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import {
  USER_REPOSITORY,
} from '@/modules/users/users.tokens';

import {
  UsersPersistenceModule,
} from '@/modules/users/infrastructure/users-persistence.module';

import type {
  UserRepository,
} from '@/modules/users/domain/repositories/user.repository';


import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
} from './auth.tokens';

import type {
  PasswordHasher,
} from './application/ports/password-hasher.port';

import type {
  RefreshTokenRepository,
} from './application/ports/refresh-token.repository';

import type {
  TokenService,
} from './application/ports/token-service.port';

import {
  LoginUseCase,
} from './application/use-cases/login.use-case';

import {
  RefreshTokenUseCase,
} from './application/use-cases/refresh-token.use-case';

import {
  LogoutUseCase,
} from './application/use-cases/logout.use-case';

import {
  ArgonPasswordHasher,
} from './infrastructure/security/argon-password-hasher';

import {
  JwtTokenService,
} from './infrastructure/security/jwt-token.service';

import {
  PrismaRefreshTokenRepository,
} from './infrastructure/persistence/prisma-refresh-token.repository';

import {
  AuthController,
} from './presentation/controllers/auth.controller';

import {
  JwtAuthGuard,
} from './presentation/guards/jwt-auth.guard';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({}),

    PrismaModule,

    UsersPersistenceModule,
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    /**
     * Password hashing implementation
     */
    {
      provide: PASSWORD_HASHER,
      useClass: ArgonPasswordHasher,
    },

    /**
     * JWT implementation
     */
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },

    /**
     * Refresh-token persistence
     */
    {
      provide:
        REFRESH_TOKEN_REPOSITORY,

      useClass:
        PrismaRefreshTokenRepository,
    },

    /**
     * Login
     */
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

        passwordHasher:
          PasswordHasher,

        tokenService:
          TokenService,

        refreshTokens:
          RefreshTokenRepository,
      ) =>
        new LoginUseCase(
          users,
          passwordHasher,
          tokenService,
          refreshTokens,
        ),
    },

    /**
     * Refresh token
     */
    {
      provide:
        RefreshTokenUseCase,

      inject: [
        USER_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
      ],

      useFactory: (
        users:
          UserRepository,

        refreshTokens:
          RefreshTokenRepository,

        passwordHasher:
          PasswordHasher,

        tokenService:
          TokenService,
      ) =>
        new RefreshTokenUseCase(
          users,
          refreshTokens,
          passwordHasher,
          tokenService,
        ),
    },

    /**
     * Logout
     */
    {
      provide:
        LogoutUseCase,

      inject: [
        TOKEN_SERVICE,
        REFRESH_TOKEN_REPOSITORY,
      ],

      useFactory: (
        tokenService:
          TokenService,

        refreshTokens:
          RefreshTokenRepository,
      ) =>
        new LogoutUseCase(
          tokenService,
          refreshTokens,
        ),
    },

    /**
     * Access-token guard
     */
    JwtAuthGuard,
  ],

  exports: [
    JwtAuthGuard,
  ],
})
export class AuthModule {}