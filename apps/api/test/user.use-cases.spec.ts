import { describe, expect, it } from "vitest";
import { GetCurrentUserUseCase } from "../src/modules/users/application/use-cases/get-current-user.use-case";
import { UpdateCurrentUserUseCase } from "../src/modules/users/application/use-cases/update-current-user.use-case";
import { User } from "../src/modules/users/domain/entities/user.entity";
import type {
  CreateUserInput,
  UpdateUserProfileInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";

class InMemoryUserRepository implements UserRepository {
  constructor(
    private user: User | null,
  ) {}

  findById(id: string): Promise<User | null> {
    return Promise.resolve(
      this.user?.id === id ? this.user : null,
    );
  }

  findByEmail(
    email: string,
  ): Promise<User | null> {
    return Promise.resolve(
      this.user?.email === email ? this.user : null,
    );
  }

  create(
    _input: CreateUserInput,
  ): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    if (!this.user || this.user.id !== id) {
      throw new Error("User not found");
    }

    this.user = new User({
      ...this.user,
      fullName: input.fullName,
      updatedAt: new Date(),
    });

    return this.user;
  }
}

const user = new User({
  id: "user-1",
  email: "alice@example.com",
  passwordHash: "hashed-password",
  fullName: "Alice",
  role: "USER",
  status: "ACTIVE",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("user use cases", () => {
  it("returns the current user DTO", async () => {
    const useCase = new GetCurrentUserUseCase(
      new InMemoryUserRepository(user),
    );

    const result = await useCase.execute("user-1");

    expect(result.email).toBe("alice@example.com");
    expect(result.createdAt).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("updates the current user's full name", async () => {
    const repository = new InMemoryUserRepository(user);
    const useCase = new UpdateCurrentUserUseCase(
      repository,
    );

    const result = await useCase.execute("user-1", {
      fullName: "Alice Updated",
    });

    expect(result.fullName).toBe("Alice Updated");
  });
});
