import {
  User,
  type UserRole,
  type UserStatus,
} from "@/modules/users/domain/entities/user.entity";

import {
  Email,
} from "@/modules/users/domain/value-objects/email.vo";

import {
  UserId,
} from "@/modules/users/domain/value-objects/user-id.vo";

export const DEFAULT_USER_DATE =
  new Date(
    "2026-01-01T00:00:00.000Z",
  );

export interface UserFactoryOverrides {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export function makeUser(
  overrides:
    Partial<UserFactoryOverrides> =
    {},
): User {
  const createdAt =
    overrides.createdAt ??
    DEFAULT_USER_DATE;

  return User.restore({
    id:
      UserId.create(
        overrides.id ??
          "user-1",
      ),

    email:
      Email.create(
        overrides.email ??
          "alice@example.com",
      ),

    passwordHash:
      overrides.passwordHash ??
      "hashed-password",

    fullName:
      overrides.fullName ??
      "Alice",

    role:
      overrides.role ??
      "USER",

    status:
      overrides.status ??
      "ACTIVE",

    version:
      overrides.version ??
      0,

    createdAt,

    updatedAt:
      overrides.updatedAt ??
      createdAt,
  });
}

export interface NewUserFactoryOverrides {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  now: Date;
}

export function makeNewUser(
  overrides:
    Partial<NewUserFactoryOverrides> =
    {},
): User {
  return User.create({
    id:
      UserId.create(
        overrides.id ??
          "user-1",
      ),

    email:
      Email.create(
        overrides.email ??
          "alice@example.com",
      ),

    passwordHash:
      overrides.passwordHash ??
      "hashed-password",

    fullName:
      overrides.fullName ??
      "Alice",

    role:
      overrides.role,

    now:
      overrides.now ??
      DEFAULT_USER_DATE,
  });
}
