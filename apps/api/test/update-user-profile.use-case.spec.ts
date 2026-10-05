import {
  describe,
  expect,
  it,
} from "vitest";

import {
  UserVersionConflictError,
} from "../src/modules/users/application/errors/user-version-conflict.error";

import {
  UserAccessPolicy,
} from "../src/modules/users/application/policies/user-access.policy";

import {
  UpdateUserProfileUseCase,
} from "../src/modules/users/application/use-cases/update-user-profile.use-case";

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

import {
  makeUser,
} from "./factories/user.factory";

import {
  FakeClock,
} from "./fakes/fake-clock";

class InMemoryUserRepository
  implements UserRepository
{
  forceConflict =
    false;

  forceError =
    false;

  saveCalls =
    0;

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
    this.saveCalls +=
      1;

    if (
      this.forceConflict
    ) {
      throw new UserVersionConflictError();
    }

    if (
      this.forceError
    ) {
      throw new Error(
        "Persistence failed",
      );
    }

    const index =
      this.users.findIndex(
        (item) =>
          item.id.equals(
            user.id,
          ),
      );

    if (
      index < 0
    ) {
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

function createFixture(
  users: User[] = [
    makeUser(),
  ],
) {
  const repository =
    new InMemoryUserRepository(
      users,
    );

  const now =
    new Date(
      "2026-10-05T10:00:00.000Z",
    );

  const useCase =
    new UpdateUserProfileUseCase(
      repository,
      new UserAccessPolicy(),
      new FakeClock(
        now,
      ),
    );

  return {
    repository,
    useCase,
    now,
  };
}

describe(
  "UpdateUserProfileUseCase",
  () => {
    it(
      "allows an admin to update another user's profile",
      async () => {
        const {
          repository,
          useCase,
          now,
        } =
          createFixture();

        const result =
          await useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
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
          repository
            .saveCalls,
        ).toBe(1);
      },
    );

    it(
      "allows a user to update their own profile",
      async () => {
        const {
          useCase,
        } =
          createFixture();

        const result =
          await useCase.execute(
            {
              id:
                "user-1",
              role:
                "USER",
            },
            "user-1",
            {
              fullName:
                "Alice Smith",
              version:
                0,
            },
          );

        expect(
          result.fullName,
        ).toBe(
          "Alice Smith",
        );
      },
    );

    it(
      "rejects a user updating another profile before reading the target",
      async () => {
        const {
          useCase,
        } =
          createFixture([
            makeUser({
              id:
                "user-2",
            }),
          ]);

        await expect(
          useCase.execute(
            {
              id:
                "user-1",
              role:
                "USER",
            },
            "user-2",
            {
              fullName:
                "Changed",
              version:
                0,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "FORBIDDEN",
          status:
            403,
        });
      },
    );

    it(
      "returns not found for an authorized missing target",
      async () => {
        const {
          useCase,
        } =
          createFixture(
            [],
          );

        await expect(
          useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
            "missing-user",
            {
              fullName:
                "Changed",
              version:
                0,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          status:
            404,
        });
      },
    );

    it(
      "rejects a stale expected version",
      async () => {
        const {
          repository,
          useCase,
        } =
          createFixture([
            makeUser({
              version:
                2,
            }),
          ]);

        await expect(
          useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
            "user-1",
            {
              fullName:
                "Changed",
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

        expect(
          repository
            .saveCalls,
        ).toBe(0);
      },
    );

    it(
      "does not persist a no-op update",
      async () => {
        const {
          repository,
          useCase,
        } =
          createFixture();

        const result =
          await useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
            "user-1",
            {
              fullName:
                "  Alice  ",
              version:
                0,
            },
          );

        expect(
          result.version,
        ).toBe(0);

        expect(
          repository
            .saveCalls,
        ).toBe(0);
      },
    );

    it(
      "maps repository optimistic-lock conflicts to application conflict",
      async () => {
        const {
          repository,
          useCase,
        } =
          createFixture();

        repository
          .forceConflict =
          true;

        await expect(
          useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
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
      "rethrows unexpected repository errors",
      async () => {
        const {
          repository,
          useCase,
        } =
          createFixture();

        repository
          .forceError =
          true;

        await expect(
          useCase.execute(
            {
              id:
                "admin-1",
              role:
                "ADMIN",
            },
            "user-1",
            {
              fullName:
                "Alice Updated",
              version:
                0,
            },
          ),
        ).rejects.toThrow(
          "Persistence failed",
        );
      },
    );
  },
);
