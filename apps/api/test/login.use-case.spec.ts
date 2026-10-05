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
  LoginUseCase,
} from "../src/modules/auth/application/use-cases/login.use-case";

import type {
  User,
} from "../src/modules/users/domain/entities/user.entity";

import type {
  FindUsersInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";

import type {
  Email,
} from "../src/modules/users/domain/value-objects/email.vo";

import type {
  UserId,
} from "../src/modules/users/domain/value-objects/user-id.vo";

import {
  makeUser,
} from "./factories/user.factory";

class InMemoryUserRepository
  implements UserRepository
{
  constructor(
    private readonly user:
      User | null,
  ) {}

  findByEmail(
    email: Email,
  ): Promise<User | null> {
    if (
      !this.user ||
      !this.user.email.equals(
        email,
      )
    ) {
      return Promise.resolve(
        null,
      );
    }

    return Promise.resolve(
      this.user,
    );
  }

  findById(
    id: UserId,
  ): Promise<User | null> {
    if (
      !this.user ||
      !this.user.id.equals(
        id,
      )
    ) {
      return Promise.resolve(
        null,
      );
    }

    return Promise.resolve(
      this.user,
    );
  }

  findMany(
    input: FindUsersInput,
  ): Promise<User[]> {
    void input;

    return Promise.resolve(
      this.user
        ? [this.user]
        : [],
    );
  }

  count(): Promise<number> {
    return Promise.resolve(
      this.user ? 1 : 0,
    );
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
  compareResult =
    true;

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
    void plainValue;
    void hashedValue;

    return Promise.resolve(
      this.compareResult,
    );
  }
}

class FakeTokenService
  implements TokenService
{
  accessPayload:
    AccessTokenPayload | null =
    null;

  generateAccessToken(
    payload: AccessTokenPayload,
  ): Promise<string> {
    this.accessPayload =
      payload;

    return Promise.resolve(
      "access-token",
    );
  }

  generateRefreshToken(
    userId: string,
  ): Promise<GeneratedRefreshToken> {
    expect(
      userId,
    ).toBe(
      "user-1",
    );

    return Promise.resolve({
      token:
        "refresh-token",
      sessionId:
        "session-1",
      expiresAt:
        new Date(
          "2026-10-06T10:00:00.000Z",
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
    void token;

    throw new Error(
      "Not implemented",
    );
  }
}

class InMemoryRefreshTokenRepository
  implements RefreshTokenRepository
{
  created:
    RefreshTokenRecord | null =
    null;

  create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    this.created = {
      ...input,
      revokedAt:
        null,
      createdAt:
        new Date(
          "2026-10-05T10:00:00.000Z",
        ),
    };

    return Promise.resolve(
      this.created,
    );
  }

  findById(
    id: string,
  ): Promise<RefreshTokenRecord | null> {
    void id;

    return Promise.resolve(
      null,
    );
  }

  revoke(
    id: string,
  ): Promise<void> {
    void id;

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

function createFixture(
  user:
    User | null =
    makeUser(),
) {
  const passwordHasher =
    new FakePasswordHasher();

  const tokenService =
    new FakeTokenService();

  const refreshTokens =
    new InMemoryRefreshTokenRepository();

  const useCase =
    new LoginUseCase(
      new InMemoryUserRepository(
        user,
      ),
      passwordHasher,
      tokenService,
      refreshTokens,
    );

  return {
    useCase,
    passwordHasher,
    tokenService,
    refreshTokens,
  };
}

describe(
  "LoginUseCase",
  () => {
    it(
      "logs in an active user and creates a refresh session",
      async () => {
        const {
          useCase,
          tokenService,
          refreshTokens,
        } =
          createFixture();

        const result =
          await useCase.execute({
            email:
              "ALICE@example.com",
            password:
              "password123",
          });

        expect(
          result.accessToken,
        ).toBe(
          "access-token",
        );

        expect(
          result.refreshToken,
        ).toBe(
          "refresh-token",
        );

        expect(
          result.user,
        ).toMatchObject({
          id:
            "user-1",
          email:
            "alice@example.com",
          status:
            "ACTIVE",
          version:
            0,
        });

        expect(
          tokenService
            .accessPayload,
        ).toEqual({
          sub:
            "user-1",
          email:
            "alice@example.com",
          role:
            "USER",
        });

        expect(
          refreshTokens
            .created,
        ).toMatchObject({
          id:
            "session-1",
          userId:
            "user-1",
          tokenHash:
            "hashed:refresh-token",
        });
      },
    );

    it(
      "rejects malformed email without querying a valid account",
      async () => {
        const {
          useCase,
        } =
          createFixture();

        await expect(
          useCase.execute({
            email:
              "not-an-email",
            password:
              "password123",
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
      "rejects a missing user",
      async () => {
        const {
          useCase,
        } =
          createFixture(
            null,
          );

        await expect(
          useCase.execute({
            email:
              "alice@example.com",
            password:
              "password123",
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
      "rejects an inactive user",
      async () => {
        const {
          useCase,
        } =
          createFixture(
            makeUser({
              status:
                "BLOCKED",
            }),
          );

        await expect(
          useCase.execute({
            email:
              "alice@example.com",
            password:
              "password123",
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
      "rejects an invalid password",
      async () => {
        const {
          useCase,
          passwordHasher,
        } =
          createFixture();

        passwordHasher
          .compareResult =
          false;

        await expect(
          useCase.execute({
            email:
              "alice@example.com",
            password:
              "wrong-password",
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
