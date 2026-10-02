import { describe, expect, it } from "vitest";
import { GetCurrentUserUseCase } from "../src/modules/users/application/use-cases/get-current-user.use-case";
import { ListUsersUseCase } from "../src/modules/users/application/use-cases/list-users.use-case";
import { UpdateCurrentUserUseCase } from "../src/modules/users/application/use-cases/update-current-user.use-case";
import { User } from "../src/modules/users/domain/entities/user.entity";
import type {
  FindUsersInput,
  UpdateUserProfileInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";

class InMemoryUserRepository implements UserRepository {
  constructor(
    private readonly users: User[],
  ) {}

  findById(
    id: string,
  ): Promise<User | null> {
    return Promise.resolve(
      this.users.find(
        (user) =>
          user.id === id,
      ) ?? null,
    );
  }

  findByEmail(
    email: string,
  ): Promise<User | null> {
    return Promise.resolve(
      this.users.find(
        (user) =>
          user.email === email,
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

  create(): Promise<User> {
    throw new Error(
      "Not implemented",
    );
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    const index =
      this.users.findIndex(
        (user) =>
          user.id === id,
      );

    if (index < 0) {
      throw new Error(
        "User not found",
      );
    }

    const current =
      this.users[index];

    const updated =
      new User({
        ...current,
        fullName:
          input.fullName,
        updatedAt:
          new Date(),
      });

    this.users[index] =
      updated;

    return updated;
  }
}

const user =
  new User({
    id: "user-1",
    email:
      "alice@example.com",
    passwordHash:
      "hashed-password",
    fullName: "Alice",
    role: "USER",
    status: "ACTIVE",
    createdAt:
      new Date(
        "2026-01-01T00:00:00.000Z",
      ),
    updatedAt:
      new Date(
        "2026-01-01T00:00:00.000Z",
      ),
  });

const admin =
  new User({
    id: "admin-1",
    email:
      "admin@example.com",
    passwordHash:
      "hashed-password",
    fullName: "Admin",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt:
      new Date(
        "2026-01-02T00:00:00.000Z",
      ),
    updatedAt:
      new Date(
        "2026-01-02T00:00:00.000Z",
      ),
  });

describe(
  "user use cases",
  () => {
    it(
      "returns the current user DTO",
      async () => {
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
      "updates the current user's full name",
      async () => {
        const repository =
          new InMemoryUserRepository(
            [user],
          );

        const useCase =
          new UpdateCurrentUserUseCase(
            repository,
          );

        const result =
          await useCase.execute(
            "user-1",
            {
              fullName:
                "Alice Updated",
            },
          );

        expect(
          result.fullName,
        ).toBe(
          "Alice Updated",
        );
      },
    );

    it(
      "returns paginated users",
      async () => {
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
