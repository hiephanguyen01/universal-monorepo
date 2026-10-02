import type { UserRole } from "@/modules/users/domain/entities/user.entity";

export const PERMISSIONS = {
  USERS_READ: "users.read",

  USERS_UPDATE: "users.update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER: [],

  ADMIN: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE],
};
