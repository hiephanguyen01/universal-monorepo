import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
  RotateRefreshTokenInput,
} from "../src/modules/auth/application/ports/refresh-token.repository";

import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from "../src/modules/auth/application/ports/token-service.port";

import {
  LogoutUseCase,
} from "../src/modules/auth/application/use-cases/logout.use-case";

class FakeTokenService
  implements TokenService
{
  shouldThrow =
    false;

  payload:
    RefreshTokenPayload = {
      sub:
        "user-1",
      jti:
        "session-1",
    };

  generateAccessToken(
    payload: AccessTokenPayload,
  ): Promise<string> {
    void payload;

    throw new Error(
      "Not implemented",
    );
  }

  generateRefreshToken(
    userId: string,
  ): Promise<GeneratedRefreshToken> {
    void userId;

    throw new Error(
      "Not implemented",
    );
  }

  verifyAccessToken(
    token: string,
  ): Promise<AccessTokenPayload> {
    void token;

    throw new Error(
      "Not implemented",
    );
  }

  verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    void token;

    if (
      this.shouldThrow
    ) {
      throw new Error(
        "Invalid token",
      );
    }

    return Promise.resolve(
      this.payload,
    );
  }
}

class InMemoryRefreshTokenRepository
  implements RefreshTokenRepository
{
  record:
    RefreshTokenRecord | null = {
      id:
        "session-1",
      userId:
        "user-1",
      tokenHash:
        "hash",
      expiresAt:
        new Date(
          "2026-10-06T10:00:00.000Z",
        ),
      revokedAt:
        null,
      createdAt:
        new Date(
          "2026-10-05T10:00:00.000Z",
        ),
    };

  revokedId:
    string | null =
    null;

  create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    const record = {
      ...input,
      revokedAt:
        null,
      createdAt:
        new Date(),
    };

    this.record =
      record;

    return Promise.resolve(
      record,
    );
  }

  findById(
    id: string,
  ): Promise<RefreshTokenRecord | null> {
    if (
      !this.record ||
      this.record.id !==
        id
    ) {
      return Promise.resolve(
        null,
      );
    }

    return Promise.resolve(
      this.record,
    );
  }

  revoke(
    id: string,
  ): Promise<void> {
    this.revokedId =
      id;

    return Promise.resolve();
  }

  revokeAllByUserId(
    userId: string,
  ): Promise<void> {
    void userId;

    return Promise.resolve();
  }

  rotate(
    input: RotateRefreshTokenInput,
  ): Promise<boolean> {
    void input;

    return Promise.resolve(
      false,
    );
  }
}

function createFixture() {
  const tokenService =
    new FakeTokenService();

  const refreshTokens =
    new InMemoryRefreshTokenRepository();

  const useCase =
    new LogoutUseCase(
      tokenService,
      refreshTokens,
    );

  return {
    useCase,
    tokenService,
    refreshTokens,
  };
}

describe(
  "LogoutUseCase",
  () => {
    it(
      "revokes a valid active refresh session",
      async () => {
        const {
          useCase,
          refreshTokens,
        } =
          createFixture();

        await useCase.execute({
          refreshToken:
            "refresh-token",
        });

        expect(
          refreshTokens
            .revokedId,
        ).toBe(
          "session-1",
        );
      },
    );

    it(
      "is idempotent for an invalid refresh token",
      async () => {
        const {
          useCase,
          tokenService,
          refreshTokens,
        } =
          createFixture();

        tokenService
          .shouldThrow =
          true;

        await expect(
          useCase.execute({
            refreshToken:
              "invalid",
          }),
        ).resolves.toBeUndefined();

        expect(
          refreshTokens
            .revokedId,
        ).toBeNull();
      },
    );

    it(
      "does nothing when the refresh session does not exist",
      async () => {
        const {
          useCase,
          refreshTokens,
        } =
          createFixture();

        refreshTokens.record =
          null;

        await useCase.execute({
          refreshToken:
            "refresh-token",
        });

        expect(
          refreshTokens
            .revokedId,
        ).toBeNull();
      },
    );

    it(
      "does nothing when the refresh session is already revoked",
      async () => {
        const {
          useCase,
          refreshTokens,
        } =
          createFixture();

        refreshTokens
          .record!.revokedAt =
          new Date();

        await useCase.execute({
          refreshToken:
            "refresh-token",
        });

        expect(
          refreshTokens
            .revokedId,
        ).toBeNull();
      },
    );

    it(
      "does nothing when the refresh token belongs to another user",
      async () => {
        const {
          useCase,
          tokenService,
          refreshTokens,
        } =
          createFixture();

        tokenService.payload = {
          sub:
            "user-2",
          jti:
            "session-1",
        };

        await useCase.execute({
          refreshToken:
            "refresh-token",
        });

        expect(
          refreshTokens
            .revokedId,
        ).toBeNull();
      },
    );
  },
);
