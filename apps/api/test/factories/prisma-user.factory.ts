import type {
  Prisma,
} from "@/generated/prisma/client";

import {
  DEFAULT_USER_DATE,
} from "./user.factory";

export function makePrismaUserData(
  overrides:
    Partial<Prisma.UserCreateInput> =
    {},
): Prisma.UserCreateInput {
  const createdAt =
    overrides.createdAt ??
    DEFAULT_USER_DATE;

  return {
    id:
      overrides.id ??
      "user-1",

    email:
      overrides.email ??
      "alice@example.com",

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

    refreshTokens:
      overrides.refreshTokens,
  };
}
