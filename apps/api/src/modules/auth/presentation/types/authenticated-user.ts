import type { UserRole } from "@/modules/users/domain/entities/user.entity";

export type AuthenticatedRole =
  UserRole;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthenticatedRole;
}
