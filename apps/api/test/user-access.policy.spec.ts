import { UserAccessPolicy } from "@/modules/users/application/policies/user-access.policy";
import { UserId } from "@/modules/users/domain/value-objects/user-id.vo";
import { describe, expect, it } from "vitest";

describe("UserAccessPolicy", () => {
  const policy = new UserAccessPolicy();

  it("allows a user to update their own profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: UserId.create("user-1"),
          role: "USER",
        },
        UserId.create("user-1"),
      ),
    ).toBe(true);
  });

  it("rejects a user updating another profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: UserId.create("user-1"),
          role: "USER",
        },
        UserId.create("user-2"),
      ),
    ).toBe(false);
  });

  it("allows admin to update another profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: UserId.create("admin-1"),
          role: "ADMIN",
        },
        UserId.create("user-2"),
      ),
    ).toBe(true);
  });
});
