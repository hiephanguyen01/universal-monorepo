import { describe, expect, it } from "vitest";

import { Email } from "../src/modules/users/domain/value-objects/email.vo";

describe("Email", () => {
  it("normalizes email", () => {
    const email = Email.create("  HIEP@EXAMPLE.COM ");

    expect(email.value).toBe("hiep@example.com");
  });

  it("rejects invalid email", () => {
    expect(() => Email.create("invalid-email")).toThrow("Email is invalid");
  });

  it("compares by value", () => {
    const first = Email.create("HIEP@EXAMPLE.COM");

    const second = Email.create("hiep@example.com");

    expect(first.equals(second)).toBe(true);
  });
});
