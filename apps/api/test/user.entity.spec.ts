import { describe, expect, it } from "vitest";

import { User } from "../src/modules/users/domain/entities/user.entity";

describe("User Entity", () => {
  it("changes full name", () => {
    const user = User.restore({
      id: "user-1",

      email: "alice@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "ACTIVE",

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    user.changeFullName("  Alice Smith  ");

    expect(user.fullName).toBe("Alice Smith");
  });

  it("rejects invalid full name", () => {
    const user = User.restore({
      id: "user-1",

      email: "alice@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "ACTIVE",

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    expect(() => user.changeFullName("A")).toThrow(
      "Full name must be between 2 and 100 characters",
    );
  });

  it("blocks user", () => {
    const user = User.restore({
      id: "user-1",

      email: "alice@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "ACTIVE",

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    user.block();

    expect(user.status).toBe("BLOCKED");

    expect(user.isActive()).toBe(false);
  });

  it("activates user", () => {
    const user = User.restore({
      id: "user-1",

      email: "alice@example.com",

      passwordHash: "hash",

      fullName: "Alice",

      role: "USER",

      status: "BLOCKED",

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    user.activate();

    expect(user.status).toBe("ACTIVE");
  });
});
