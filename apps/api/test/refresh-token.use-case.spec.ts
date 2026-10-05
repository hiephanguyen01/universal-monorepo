import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  PasswordHasher,
} from "../src/modules/auth/application/ports/password-hasher.port";

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
  RefreshTokenUseCase,
} from "../src/modules/auth/application/use-cases/refresh-token.use-case";

import {
  User,
} from "../src/modules/users/domain/entities/user.entity";

import type {
  FindUsersInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";

import {
  Email,
} from "../src/modules/users/domain/value-objects/email.vo";

import {
  UserId,
} from "../src/modules/users/domain/value-objects/user-id.vo";

class InMemoryUserRepository
  implements UserRepository
{
  constructor(
    private readonly user:
      User,
  ) {}

  findById(
    id: UserId,
  ): Promise<User | null> {
    return Promise.resolve(
      this.user.id.equals(
        id,
      )
        ? this.user
        : null,
    );
  }

  findByEmail(
    email: Email,
  ): Promise<User | null> {
    return Promise.resolve(
      this.user.email.equals(
        email,
      )
        ? this.user
        : null,
    );
  }

  findMany(
    input: FindUsersInput,
  ): Promise<User[]> {
    void input;

    return Promise.resolve([
      this.user,
    ]);
  }

  count(): Promise<number> {
    return Promise.resolve(1);
  }

  create(
    user: User,
  ): Promise<User> {
    return Promise.resolve(
      user,
    );
  }

  save(
    user: User,
  ): Promise<User> {
    return Promise.resolve(
      user,
    );
  }
}

class FakePasswordHasher
  implements PasswordHasher
{
  hash(
    value: string,
  ): Promise<string> {
    return Promise.resolve(
      `hashed:${value}`,
    );
  }

  compare(
    plainValue: string,
    hashedValue: string,
  ): Promise<boolean> {
    return Promise.resolve(
      hashedValue ===
        `hashed:${plainValue}`,
    );
  }
}

class FakeTokenService
  implements TokenService
{
  generateAccessToken(
    payload: AccessTokenPayload,
  ): Promise<string> {
    void payload;

    return Promise.resolve(
      "access-2",
    );
  }

  generateRefreshToken(
    userId: string,
  ): Promise<GeneratedRefreshToken> {
    void userId;

    return Promise.resolve({
      token:
        "refresh-2",
      sessionId:
        "session-2",
      expiresAt:
        new Date(
          Date.now() +
            60_000,
        ),
    });
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
    if (
      token !==
      "refresh-1"
    ) {
      throw new Error(
        "Invalid token",
      );
    }

    return Promise.resolve({
      sub:
        "user-1",
      jti:
        "session-1",
    });
  }
}

class InMemoryRefreshTokenRepository
  implements RefreshTokenRepository
{
  readonly items =
    new Map<
      string,
      RefreshTokenRecord
    >();

  forceRotateFailure =
    false;

  create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    const record:
      RefreshTokenRecord = {
      ...input,
      revokedAt:
        null,
      createdAt:
        new Date(),
    };

    this.items.set(
      record.id,
      record,
    );

    return Promise.resolve(
      record,
    );
  }

  findById(
    id: string,
  ): Promise<RefreshTokenRecord | null> {
    return Promise.resolve(
      this.items.get(id) ??
        null,
    );
  }

  revoke(
    id: string,
  ): Promise<void> {
    const record =
      this.items.get(id);

    if (record) {
      record.revokedAt =
        new Date();
    }

    return Promise.resolve();
  }

  revokeAllByUserId(
    userId: string,
  ): Promise<void> {
    for (
      const record
      of this.items.values()
    ) {
      if (
        record.userId ===
        userId
      ) {
        record.revokedAt =
          new Date();
      }
    }

    return Promise.resolve();
  }

  rotate(
    input: RotateRefreshTokenInput,
  ): Promise<boolean> {
    if (
      this.forceRotateFailure
    ) {
      return Promise.resolve(
        false,
      );
    }

    const current =
      this.items.get(
        input.currentSessionId,
      );

    if (
      !current ||
      current.revokedAt
    ) {
      return Promise.resolve(
        false,
      );
    }

    current.revokedAt =
      new Date();

    const next:
      RefreshTokenRecord = {
      ...input.nextSession,
      revokedAt:
        null,
      createdAt:
        new Date(),
    };

    this.items.set(
      next.id,
      next,
    );

    return Promise.resolve(
      true,
    );
  }
}

function createFixture() {
  const user =
    User.restore({
      id:
        UserId.create(
          "user-1",
        ),
      email:
        Email.create(
          "alice@example.com",
        ),
      passwordHash:
        "hashed-password",
      fullName:
        "Alice",
      role:
        "USER",
      status:
        "ACTIVE",
      version:
        0,
      createdAt:
        new Date(
          "2026-01-01T00:00:00.000Z",
        ),
      updatedAt:
        new Date(
          "2026-01-01T00:00:00.000Z",
        ),
    });

  const refreshTokens =
    new InMemoryRefreshTokenRepository();

  refreshTokens.items.set(
    "session-1",
    {
      id:
        "session-1",
      userId:
        "user-1",
      tokenHash:
        "hashed:refresh-1",
      expiresAt:
        new Date(
          Date.now() +
            60_000,
        ),
      revokedAt:
        null,
      createdAt:
        new Date(),
    },
  );

  const useCase =
    new RefreshTokenUseCase(
      new InMemoryUserRepository(
        user,
      ),
      refreshTokens,
      new FakePasswordHasher(),
      new FakeTokenService(),
    );

  return {
    useCase,
    refreshTokens,
  };
}

describe(
  "RefreshTokenUseCase",
  () => {
    it(
      "rotates refresh token and revokes the old session",
      async () => {
        const {
          useCase,
          refreshTokens,
        } =
          createFixture();

        const result =
          await useCase.execute({
            refreshToken:
              "refresh-1",
          });

        expect(
          result,
        ).toEqual({
          accessToken:
            "access-2",
          refreshToken:
            "refresh-2",
        });

        expect(
          refreshTokens.items
            .get(
              "session-1",
            )
            ?.revokedAt,
        ).toBeInstanceOf(
          Date,
        );

        expect(
          refreshTokens.items.has(
            "session-2",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects replay of an already used refresh token",
      async () => {
        const {
          useCase,
        } =
          createFixture();

        await useCase.execute({
          refreshToken:
            "refresh-1",
        });

        await expect(
          useCase.execute({
            refreshToken:
              "refresh-1",
          }),
        ).rejects.toMatchObject({
          code:
            "UNAUTHORIZED",
          status:
            401,
        });
      },
    );

    it(
      "rejects when another request wins the rotation race",
      async () => {
        const {
          useCase,
          refreshTokens,
        } =
          createFixture();

        refreshTokens.forceRotateFailure =
          true;

        await expect(
          useCase.execute({
            refreshToken:
              "refresh-1",
          }),
        ).rejects.toMatchObject({
          code:
            "UNAUTHORIZED",
          status:
            401,
        });
      },
    );
  },
);
