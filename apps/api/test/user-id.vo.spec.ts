import { describe, expect, it } from "vitest";

import { UserId } from "../src/modules/users/domain/value-objects/user-id.vo";

describe("UserId", () => {
  it("creates a user id", () => {
    const id = UserId.create("user-1");

    expect(id.value).toBe("user-1");
  });

  it("trims user id", () => {
    const id = UserId.create("  user-1  ");

    expect(id.value).toBe("user-1");
  });

  it("rejects empty id", () => {
    expect(() => UserId.create("   ")).toThrow("User id is invalid");
  });

  it("compares ids by value", () => {
    const first = UserId.create("user-1");

    const second = UserId.create("user-1");

    expect(first.equals(second)).toBe(true);
  });
});
