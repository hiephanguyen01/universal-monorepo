import { describe, expect, it } from "vitest";

import { UserMapper } from "../src/modules/users/infrastructure/mappers/user.mapper";

import {
  makeNewUser,
} from "./factories/user.factory";

describe("UserMapper", () => {
  it("maps persistence to domain", () => {
    const user = UserMapper.toDomain({
      id: "user-1",

      email: "ALICE@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "ACTIVE",

      version: 7,

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    expect(user.id.value).toBe("user-1");

    expect(user.email.value).toBe("alice@example.com");

    expect(user.version).toBe(7);
  });

  it("maps domain to persistence", () => {
    const user =
      makeNewUser({
        passwordHash:
          "hash",

        now:
          new Date(
            "2026-01-01T00:00:00.000Z",
          ),
      });

    const data = UserMapper.toPersistence(user);

    expect(data.id).toBe("user-1");

    expect(data.email).toBe("alice@example.com");

    expect(data.version).toBe(0);
  });
});
