import { describe, expect, it } from "vitest";
import { RegisterUseCase } from "../src/modules/auth/application/use-cases/register.use-case";
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
import { User } from "../src/modules/users/domain/entities/user.entity";
import type {
  CreateUserInput,
  UpdateUserProfileInput,
  UserRepository,
} from "../src/modules/users/domain/repositories/user.repository";

class InMemoryUserRepository implements UserRepository {
  readonly items: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((user) => user.id === id) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = new User({
      id: "user-1",
      email: input.email,
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      role: input.role ?? "USER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.items.push(user);

    return user;
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return new User({
      ...user,
      fullName: input.fullName,
      updatedAt: new Date(),
    });
  }
}

class FakePasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return Promise.resolve(`hashed:${value}`);
  }

  compare(
    plainValue: string,
    hashedValue: string,
  ): Promise<boolean> {
    return Promise.resolve(
      hashedValue === `hashed:${plainValue}`,
    );
  }
}

class FakeTokenService implements TokenService {
  generateAccessToken(
    _payload: AccessTokenPayload,
  ): Promise<string> {
    return Promise.resolve("access-token");
  }

  generateRefreshToken(
    _userId: string,
  ): Promise<GeneratedRefreshToken> {
    return Promise.resolve({
      token: "refresh-token",
      sessionId: "session-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
  }

  verifyAccessToken(
    _token: string,
  ): Promise<AccessTokenPayload> {
    throw new Error("Not implemented");
  }

  verifyRefreshToken(
    _token: string,
  ): Promise<RefreshTokenPayload> {
    throw new Error("Not implemented");
  }
}

class InMemoryRefreshTokenRepository
  implements RefreshTokenRepository
{
  readonly items = new Map<string, RefreshTokenRecord>();

  async create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = {
      ...input,
      revokedAt: null,
      createdAt: new Date(),
    };

    this.items.set(record.id, record);

    return record;
  }

  async findById(
    id: string,
  ): Promise<RefreshTokenRecord | null> {
    return this.items.get(id) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const record = this.items.get(id);

    if (record) {
      record.revokedAt = new Date();
    }
  }

  async revokeAllByUserId(
    userId: string,
  ): Promise<void> {
    for (const record of this.items.values()) {
      if (record.userId === userId) {
        record.revokedAt = new Date();
      }
    }
  }
}

describe("RegisterUseCase", () => {
  it("creates a user and refresh session", async () => {
    const users = new InMemoryUserRepository();
    const sessions = new InMemoryRefreshTokenRepository();

    const useCase = new RegisterUseCase(
      users,
      new FakePasswordHasher(),
      new FakeTokenService(),
      sessions,
    );

    const result = await useCase.execute({
      email: "A@EXAMPLE.COM",
      password: "password123",
      fullName: "Alice",
    });

    expect(result.user.email).toBe("a@example.com");
    expect(users.items[0]?.passwordHash).toBe(
      "hashed:password123",
    );
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(sessions.items.has("session-1")).toBe(true);
  });
});
