import { describe, expect, it } from "vitest";

import type { IdGenerator } from "../src/common/ports/id-generator.port";
import type { PasswordHasher } from "../src/modules/auth/application/ports/password-hasher.port";
import type {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "../src/modules/auth/application/ports/refresh-token.repository";
import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from "../src/modules/auth/application/ports/token-service.port";
import { RegisterUseCase } from "../src/modules/auth/application/use-cases/register.use-case";
import { User } from "../src/modules/users/domain/entities/user.entity";
import type {
  FindUsersInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";
import type { Email } from "../src/modules/users/domain/value-objects/email.vo";

class InMemoryUserRepository
  implements UserRepository
{
  readonly items: User[] = [];

  findByEmail(
    email: Email,
  ): Promise<User | null> {
    return Promise.resolve(
      this.items.find(
        (user) =>
          user.email.equals(
            email,
          ),
      ) ?? null,
    );
  }

  findById(
    id: string,
  ): Promise<User | null> {
    return Promise.resolve(
      this.items.find(
        (user) =>
          user.id === id,
      ) ?? null,
    );
  }

  findMany(
    input: FindUsersInput,
  ): Promise<User[]> {
    return Promise.resolve(
      this.items.slice(
        input.skip,
        input.skip +
          input.take,
      ),
    );
  }

  count(): Promise<number> {
    return Promise.resolve(
      this.items.length,
    );
  }

  create(
    user: User,
  ): Promise<User> {
    this.items.push(
      user,
    );

    return Promise.resolve(
      user,
    );
  }

  save(
    user: User,
  ): Promise<User> {
    const index =
      this.items.findIndex(
        (item) =>
          item.id === user.id,
      );

    if (index < 0) {
      throw new Error(
        "User not found",
      );
    }

    this.items[index] =
      user;

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
      "access-token",
    );
  }

  generateRefreshToken(
    userId: string,
  ): Promise<GeneratedRefreshToken> {
    void userId;

    return Promise.resolve({
      token:
        "refresh-token",
      sessionId:
        "session-1",
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
    void token;

    throw new Error(
      "Not implemented",
    );
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

  create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    const record:
      RefreshTokenRecord = {
      ...input,
      revokedAt: null,
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
}

class FakeIdGenerator
  implements IdGenerator
{
  generate(): string {
    return "user-1";
  }
}

function createUseCase(
  users:
    InMemoryUserRepository,
  sessions:
    InMemoryRefreshTokenRepository,
) {
  return new RegisterUseCase(
    users,
    new FakePasswordHasher(),
    new FakeTokenService(),
    sessions,
    new FakeIdGenerator(),
  );
}

describe(
  "RegisterUseCase",
  () => {
    it(
      "creates a normalized user and refresh session",
      async () => {
        const users =
          new InMemoryUserRepository();

        const sessions =
          new InMemoryRefreshTokenRepository();

        const useCase =
          createUseCase(
            users,
            sessions,
          );

        const result =
          await useCase.execute({
            email:
              "A@EXAMPLE.COM",
            password:
              "password123",
            fullName:
              "  Alice  ",
          });

        expect(
          result.user.id,
        ).toBe(
          "user-1",
        );

        expect(
          result.user.email,
        ).toBe(
          "a@example.com",
        );

        expect(
          result.user.fullName,
        ).toBe(
          "Alice",
        );

        expect(
          result.user.status,
        ).toBe(
          "ACTIVE",
        );

        expect(
          users.items[0]
            ?.passwordHash,
        ).toBe(
          "hashed:password123",
        );

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
          sessions.items.has(
            "session-1",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a duplicate email after normalization",
      async () => {
        const users =
          new InMemoryUserRepository();

        const sessions =
          new InMemoryRefreshTokenRepository();

        const useCase =
          createUseCase(
            users,
            sessions,
          );

        await useCase.execute({
          email:
            "alice@example.com",
          password:
            "password123",
          fullName:
            "Alice",
        });

        await expect(
          useCase.execute({
            email:
              "ALICE@EXAMPLE.COM",
            password:
              "password123",
            fullName:
              "Alice Two",
          }),
        ).rejects.toMatchObject({
          code:
            "EMAIL_ALREADY_EXISTS",
          status: 409,
        });
      },
    );
  },
);
