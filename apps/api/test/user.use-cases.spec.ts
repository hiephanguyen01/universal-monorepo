import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../src/common/ports/clock.port";

import {
  GetCurrentUserUseCase,
} from "../src/modules/users/application/use-cases/get-current-user.use-case";

import {
  UserVersionConflictError,
} from "../src/modules/users/application/errors/user-version-conflict.error";

import {
  ListUsersUseCase,
} from "../src/modules/users/application/use-cases/list-users.use-case";

import {
  UpdateCurrentUserUseCase,
} from "../src/modules/users/application/use-cases/update-current-user.use-case";

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

class FakeClock
  implements Clock
{
  constructor(
    private readonly current:
      Date,
  ) {}

  now(): Date {
    return this.current;
  }
}

class InMemoryUserRepository
  implements UserRepository
{
  forceConflict = false;

  constructor(
    private readonly users:
      User[],
  ) {}

  findById(
    id: UserId,
  ): Promise<User | null> {
    return Promise.resolve(
      this.users.find(
        (user) =>
          user.id.equals(
            id,
          ),
      ) ?? null,
    );
  }

  findByEmail(
    email: Email,
  ): Promise<User | null> {
    return Promise.resolve(
      this.users.find(
        (user) =>
          user.email.equals(
            email,
          ),
      ) ?? null,
    );
  }

  findMany(
    input: FindUsersInput,
  ): Promise<User[]> {
    return Promise.resolve(
      this.users.slice(
        input.skip,
        input.skip +
          input.take,
      ),
    );
  }

  count(): Promise<number> {
    return Promise.resolve(
      this.users.length,
    );
  }

  create(
    user: User,
  ): Promise<User> {
    this.users.push(
      user,
    );

    return Promise.resolve(
      user,
    );
  }

  save(
    user: User,
  ): Promise<User> {
    if (this.forceConflict) {
      throw new UserVersionConflictError();
    }

    const index =
      this.users.findIndex(
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

    const saved =
      User.restore({
        id:
          user.id,
        email:
          user.email,
        passwordHash:
          user.passwordHash,
        fullName:
          user.fullName,
        role:
          user.role,
        status:
          user.status,
        version:
          user.version + 1,
        createdAt:
          user.createdAt,
        updatedAt:
          user.updatedAt,
      });

    this.users[index] =
      saved;

    return Promise.resolve(
      saved,
    );
  }
}

function createUser(
  input: {
    id: string;
    email: string;
    fullName: string;
    role:
      | "USER"
      | "ADMIN";
    createdAt: string;
  },
): User {
  const createdAt =
    new Date(
      input.createdAt,
    );

  return User.restore({
    id:
      UserId.create(
        input.id,
      ),
    email:
      Email.create(
        input.email,
      ),
    passwordHash:
      "hashed-password",
    fullName:
      input.fullName,
    role:
      input.role,
    status:
      "ACTIVE",
    version:
      0,
    createdAt,
    updatedAt:
      createdAt,
  });
}

describe(
  "user use cases",
  () => {
    it(
      "returns the current user DTO",
      async () => {
        const user =
          createUser({
            id:
              "user-1",
            email:
              "alice@example.com",
            fullName:
              "Alice",
            role:
              "USER",
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });

        const useCase =
          new GetCurrentUserUseCase(
            new InMemoryUserRepository(
              [user],
            ),
          );

        const result =
          await useCase.execute(
            "user-1",
          );

        expect(
          result.email,
        ).toBe(
          "alice@example.com",
        );

        expect(
          result.createdAt,
        ).toBe(
          "2026-01-01T00:00:00.000Z",
        );
      },
    );

    it(
      "updates the current user's full name with clock time",
      async () => {
        const user =
          createUser({
            id:
              "user-1",
            email:
              "alice@example.com",
            fullName:
              "Alice",
            role:
              "USER",
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });

        const repository =
          new InMemoryUserRepository(
            [user],
          );

        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        const useCase =
          new UpdateCurrentUserUseCase(
            repository,
            new FakeClock(
              now,
            ),
          );

        const result =
          await useCase.execute(
            "user-1",
            {
              fullName:
                "  Alice Updated  ",
              version:
                0,
            },
          );

        expect(
          result.fullName,
        ).toBe(
          "Alice Updated",
        );

        expect(
          result.version,
        ).toBe(1);

        expect(
          result.updatedAt,
        ).toBe(
          now.toISOString(),
        );

        expect(
          (
            await repository
              .findById(
                UserId.create(
                  "user-1",
                ),
              )
          )?.fullName,
        ).toBe(
          "Alice Updated",
        );
      },
    );

    it(
      "rejects a stale profile version",
      async () => {
        const user =
          createUser({
            id:
              "user-1",
            email:
              "alice@example.com",
            fullName:
              "Alice",
            role:
              "USER",
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });

        const repository =
          new InMemoryUserRepository(
            [user],
          );

        const useCase =
          new UpdateCurrentUserUseCase(
            repository,
            new FakeClock(
              new Date(
                "2026-10-05T10:00:00.000Z",
              ),
            ),
          );

        await expect(
          useCase.execute(
            "user-1",
            {
              fullName:
                "Alice Updated",
              version:
                1,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "USER_CONCURRENT_MODIFICATION",
          status:
            409,
        });
      },
    );

    it(
      "maps repository optimistic-lock conflict to 409",
      async () => {
        const user =
          createUser({
            id:
              "user-1",
            email:
              "alice@example.com",
            fullName:
              "Alice",
            role:
              "USER",
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });

        const repository =
          new InMemoryUserRepository(
            [user],
          );

        repository.forceConflict =
          true;

        const useCase =
          new UpdateCurrentUserUseCase(
            repository,
            new FakeClock(
              new Date(
                "2026-10-05T10:00:00.000Z",
              ),
            ),
          );

        await expect(
          useCase.execute(
            "user-1",
            {
              fullName:
                "Alice Updated",
              version:
                0,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "USER_CONCURRENT_MODIFICATION",
          status:
            409,
        });
      },
    );

    it(
      "returns paginated users",
      async () => {
        const admin =
          createUser({
            id:
              "admin-1",
            email:
              "admin@example.com",
            fullName:
              "Admin",
            role:
              "ADMIN",
            createdAt:
              "2026-01-02T00:00:00.000Z",
          });

        const user =
          createUser({
            id:
              "user-1",
            email:
              "alice@example.com",
            fullName:
              "Alice",
            role:
              "USER",
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });

        const useCase =
          new ListUsersUseCase(
            new InMemoryUserRepository(
              [
                admin,
                user,
              ],
            ),
          );

        const result =
          await useCase.execute({
            page: 1,
            pageSize: 1,
          });

        expect(
          result.items,
        ).toHaveLength(1);

        expect(
          result.items[0]?.email,
        ).toBe(
          "admin@example.com",
        );

        expect(
          result.meta,
        ).toEqual({
          page: 1,
          pageSize: 1,
          total: 2,
          totalPages: 2,
        });
      },
    );
  },
);
