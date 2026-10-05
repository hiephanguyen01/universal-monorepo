import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  IdGenerator,
} from "../src/common/ports/id-generator.port";

import type {
  PasswordHasher,
} from "../src/modules/auth/application/ports/password-hasher.port";

import type {
  RefreshTokenRecord,
} from "../src/modules/auth/application/ports/refresh-token.repository";

import type {
  RegisterTransactionInput,
  RegistrationUnitOfWork,
} from "../src/modules/auth/application/ports/registration-unit-of-work.port";

import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from "../src/modules/auth/application/ports/token-service.port";

import {
  RegisterUseCase,
} from "../src/modules/auth/application/use-cases/register.use-case";

import {
  DuplicateUserEmailError,
} from "../src/modules/users/application/errors/duplicate-user-email.error";

import {
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
  FakeClock,
} from "./fakes/fake-clock";

class InMemoryUserRepository
  implements UserRepository
{
  readonly items: User[] =
    [];

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
    id: UserId,
  ): Promise<User | null> {
    return Promise.resolve(
      this.items.find(
        (user) =>
          user.id.equals(
            id,
          ),
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
          item.id.equals(
            user.id,
          ),
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

class InMemoryRegistrationUnitOfWork
  implements RegistrationUnitOfWork
{
  readonly sessions =
    new Map<
      string,
      RefreshTokenRecord
    >();

  failBeforeCommit =
    false;

  duplicateEmail =
    false;

  constructor(
    private readonly users:
      InMemoryUserRepository,
  ) {}

  execute(
    input:
      RegisterTransactionInput,
  ): Promise<User> {
    if (
      this.duplicateEmail
    ) {
      throw new DuplicateUserEmailError();
    }

    if (
      this.failBeforeCommit
    ) {
      throw new Error(
        "Transaction failed",
      );
    }

    const session:
      RefreshTokenRecord = {
      ...input.refreshToken,
      revokedAt:
        null,
      createdAt:
        new Date(
          "2026-10-05T10:00:00.000Z",
        ),
    };

    this.users.items.push(
      input.user,
    );

    this.sessions.set(
      session.id,
      session,
    );

    return Promise.resolve(
      input.user,
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

class FakeIdGenerator
  implements IdGenerator
{
  generate(): string {
    return "user-1";
  }
}

function createFixture() {
  const users =
    new InMemoryUserRepository();

  const unitOfWork =
    new InMemoryRegistrationUnitOfWork(
      users,
    );

  const now =
    new Date(
      "2026-10-05T10:00:00.000Z",
    );

  const useCase =
    new RegisterUseCase(
      users,
      new FakePasswordHasher(),
      new FakeTokenService(),
      unitOfWork,
      new FakeIdGenerator(),
      new FakeClock(
        now,
      ),
    );

  return {
    users,
    unitOfWork,
    useCase,
    now,
  };
}

describe(
  "RegisterUseCase",
  () => {
    it(
      "creates a normalized user and refresh session atomically",
      async () => {
        const {
          users,
          unitOfWork,
          useCase,
          now,
        } =
          createFixture();

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
          result.user.createdAt,
        ).toBe(
          now.toISOString(),
        );

        expect(
          users.items,
        ).toHaveLength(1);

        expect(
          users.items[0]
            ?.passwordHash,
        ).toBe(
          "hashed:password123",
        );

        expect(
          unitOfWork.sessions.has(
            "session-1",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a duplicate email after normalization",
      async () => {
        const {
          useCase,
        } =
          createFixture();

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
          status:
            409,
        });
      },
    );

    it(
      "rolls back registration state when the transaction fails",
      async () => {
        const {
          users,
          unitOfWork,
          useCase,
        } =
          createFixture();

        unitOfWork.failBeforeCommit =
          true;

        await expect(
          useCase.execute({
            email:
              "alice@example.com",
            password:
              "password123",
            fullName:
              "Alice",
          }),
        ).rejects.toThrow(
          "Transaction failed",
        );

        expect(
          users.items,
        ).toHaveLength(0);

        expect(
          unitOfWork.sessions.size,
        ).toBe(0);
      },
    );

    it(
      "maps a concurrent duplicate email to conflict",
      async () => {
        const {
          users,
          unitOfWork,
          useCase,
        } =
          createFixture();

        unitOfWork.duplicateEmail =
          true;

        await expect(
          useCase.execute({
            email:
              "alice@example.com",
            password:
              "password123",
            fullName:
              "Alice",
          }),
        ).rejects.toMatchObject({
          code:
            "EMAIL_ALREADY_EXISTS",
          status:
            409,
        });

        expect(
          users.items,
        ).toHaveLength(0);

        expect(
          unitOfWork.sessions.size,
        ).toBe(0);
      },
    );
  },
);
