import {
  UnauthorizedError,
} from "@/common/errors";

import type {
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";

import type {
  PasswordHasher,
} from "../ports/password-hasher.port";

import type {
  RefreshTokenRepository,
} from "../ports/refresh-token.repository";

import type {
  TokenService,
} from "../ports/token-service.port";

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly users:
      UserRepository,

    private readonly refreshTokens:
      RefreshTokenRepository,

    private readonly passwordHasher:
      PasswordHasher,

    private readonly tokenService:
      TokenService,
  ) {}

  async execute(
    input: RefreshTokenInput,
  ): Promise<RefreshTokenOutput> {
    let payload;

    try {
      payload =
        await this.tokenService
          .verifyRefreshToken(
            input.refreshToken,
          );
    } catch {
      throw new UnauthorizedError(
        "Invalid refresh token",
      );
    }

    const session =
      await this.refreshTokens
        .findById(
          payload.jti,
        );

    if (!session) {
      throw new UnauthorizedError(
        "Refresh session not found",
      );
    }

    if (session.revokedAt) {
      throw new UnauthorizedError(
        "Refresh token has been revoked",
      );
    }

    if (
      session.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new UnauthorizedError(
        "Refresh token has expired",
      );
    }

    if (
      session.userId !==
      payload.sub
    ) {
      throw new UnauthorizedError(
        "Invalid refresh token",
      );
    }

    const tokenMatched =
      await this.passwordHasher
        .compare(
          input.refreshToken,
          session.tokenHash,
        );

    if (!tokenMatched) {
      throw new UnauthorizedError(
        "Invalid refresh token",
      );
    }

    const user =
      await this.users.findById(
        session.userId,
      );

    if (
      !user ||
      !user.isActive()
    ) {
      throw new UnauthorizedError(
        "User is not active",
      );
    }

    const accessToken =
      await this.tokenService
        .generateAccessToken({
          sub:
            user.id,

          email:
            user.email.value,

          role:
            user.role,
        });

    const nextRefreshToken =
      await this.tokenService
        .generateRefreshToken(
          user.id,
        );

    const nextTokenHash =
      await this.passwordHasher
        .hash(
          nextRefreshToken.token,
        );

    const rotated =
      await this.refreshTokens
        .rotate({
          currentSessionId:
            session.id,

          nextSession: {
            id:
              nextRefreshToken
                .sessionId,

            userId:
              user.id,

            tokenHash:
              nextTokenHash,

            expiresAt:
              nextRefreshToken
                .expiresAt,
          },
        });

    if (!rotated) {
      throw new UnauthorizedError(
        "Refresh token has already been used",
      );
    }

    return {
      accessToken,
      refreshToken:
        nextRefreshToken.token,
    };
  }
}
