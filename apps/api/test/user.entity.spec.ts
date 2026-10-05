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

const ORIGINAL =
  new Date(
    "2026-01-01T00:00:00.000Z",
  );

const LATER =
  new Date(
    "2026-10-05T10:00:00.000Z",
  );

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
    version:
      0,
    createdAt:
      ORIGINAL,
    updatedAt:
      ORIGINAL,
  });
}

describe(
  "User Entity",
  () => {
    it(
      "creates a new active user with explicit time",
      () => {
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
            now:
              ORIGINAL,
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
          user.version,
        ).toBe(0);

        expect(
          user.createdAt,
        ).toEqual(
          ORIGINAL,
        );

        expect(
          user.updatedAt,
        ).toEqual(
          ORIGINAL,
        );
      },
    );

    it(
      "changes full name and updates timestamp",
      () => {
        const user =
          restoreUser();

        user.changeFullName(
          "  Alice Smith  ",
          LATER,
        );

        expect(
          user.fullName,
        ).toBe(
          "Alice Smith",
        );

        expect(
          user.version,
        ).toBe(0);

        expect(
          user.updatedAt,
        ).toEqual(
          LATER,
        );
      },
    );

    it(
      "does not update timestamp when full name is unchanged",
      () => {
        const user =
          restoreUser();

        user.changeFullName(
          "  Alice  ",
          LATER,
        );

        expect(
          user.updatedAt,
        ).toEqual(
          ORIGINAL,
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
            LATER,
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

        user.block(
          LATER,
        );

        expect(
          user.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          user.updatedAt,
        ).toEqual(
          LATER,
        );

        expect(
          user.isActive(),
        ).toBe(false);
      },
    );

    it(
      "does not touch blocked user again",
      () => {
        const user =
          restoreUser(
            "BLOCKED",
          );

        user.block(
          LATER,
        );

        expect(
          user.updatedAt,
        ).toEqual(
          ORIGINAL,
        );
      },
    );

    it(
      "activates user",
      () => {
        const user =
          restoreUser(
            "BLOCKED",
          );

        user.activate(
          LATER,
        );

        expect(
          user.status,
        ).toBe(
          "ACTIVE",
        );

        expect(
          user.updatedAt,
        ).toEqual(
          LATER,
        );

        expect(
          user.isActive(),
        ).toBe(true);
      },
    );
  },
);
