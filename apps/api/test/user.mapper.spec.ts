import { describe, expect, it } from "vitest";

import { User } from "../src/modules/users/domain/entities/user.entity";

import { Email } from "../src/modules/users/domain/value-objects/email.vo";

import { UserId } from "../src/modules/users/domain/value-objects/user-id.vo";

import { UserMapper } from "../src/modules/users/infrastructure/mappers/user.mapper";

describe("UserMapper", () => {
  it("maps persistence to domain", () => {
    const user = UserMapper.toDomain({
      id: "user-1",

      email: "ALICE@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "ACTIVE",

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    expect(user.id.value).toBe("user-1");

    expect(user.email.value).toBe("alice@example.com");
  });

  it("maps domain to persistence", () => {
    const user = User.create({
      id: UserId.create("user-1"),

      email: Email.create("alice@example.com"),

      passwordHash: "hash",

      fullName: "Alice",

      now: new Date(
        "2026-01-01T00:00:00.000Z",
      ),
    });

    const data = UserMapper.toPersistence(user);

    expect(data.id).toBe("user-1");

    expect(data.email).toBe("alice@example.com");
  });
});
