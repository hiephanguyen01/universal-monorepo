import {
  describe,
  expect,
  it,
} from "vitest";

import {
  User,
} from "../src/modules/users/domain/entities/user.entity";

import {
  Email,
} from "../src/modules/users/domain/value-objects/email.vo";

import {
  UserId,
} from "../src/modules/users/domain/value-objects/user-id.vo";

function restoreUser(
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "BLOCKED" =
    "ACTIVE",
): User {
  return User.restore({
    id:
      UserId.create(
        "user-1",
      ),
    email:
      Email.create(
        "alice@example.com",
      ),
    passwordHash:
      "hash",
    fullName:
      "Alice",
    role:
      "USER",
    status,
    createdAt:
      new Date(
        "2026-01-01T00:00:00.000Z",
      ),
    updatedAt:
      new Date(
        "2026-01-01T00:00:00.000Z",
      ),
  });
}

describe(
  "User Entity",
  () => {
    it(
      "creates a new active user with defaults",
      () => {
        const now =
          new Date(
            "2026-01-01T00:00:00.000Z",
          );

        const user =
          User.create({
            id:
      UserId.create(
        "user-1",
      ),
            email:
              Email.create(
                "alice@example.com",
              ),
            passwordHash:
              "hash",
            fullName:
              "  Alice  ",
            now,
          });

        expect(
          user.id.value,
        ).toBe(
          "user-1",
        );

        expect(
          user.fullName,
        ).toBe(
          "Alice",
        );

        expect(
          user.role,
        ).toBe(
          "USER",
        );

        expect(
          user.status,
        ).toBe(
          "ACTIVE",
        );

        expect(
          user.createdAt,
        ).toEqual(
          now,
        );

        expect(
          user.updatedAt,
        ).toEqual(
          now,
        );
      },
    );

    it(
      "changes full name",
      () => {
        const user =
          restoreUser();

        user.changeFullName(
          "  Alice Smith  ",
        );

        expect(
          user.fullName,
        ).toBe(
          "Alice Smith",
        );
      },
    );

    it(
      "rejects invalid full name",
      () => {
        const user =
          restoreUser();

        expect(() =>
          user.changeFullName(
            "A",
          ),
        ).toThrow(
          "Full name must be between 2 and 100 characters",
        );
      },
    );

    it(
      "blocks user",
      () => {
        const user =
          restoreUser();

        user.block();

        expect(
          user.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          user.isActive(),
        ).toBe(false);
      },
    );

    it(
      "activates user",
      () => {
        const user =
          restoreUser(
            "BLOCKED",
          );

        user.activate();

        expect(
          user.status,
        ).toBe(
          "ACTIVE",
        );

        expect(
          user.isActive(),
        ).toBe(true);
      },
    );
  },
);
