import { UserAccessPolicy } from "@/modules/auth/application/policies/user-access.policy";
import { describe, expect, it } from "vitest";

describe("UserAccessPolicy", () => {
  const policy = new UserAccessPolicy();

  it("allows a user to update their own profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: "user-1",
          role: "USER",
        },

        "user-1",
      ),
    ).toBe(true);
  });

  it("rejects a user updating another profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: "user-1",
          role: "USER",
        },

        "user-2",
      ),
    ).toBe(false);
  });

  it("allows admin to update another profile", () => {
    expect(
      policy.canUpdateProfile(
        {
          id: "admin-1",
          role: "ADMIN",
        },

        "user-2",
      ),
    ).toBe(true);
  });
});
