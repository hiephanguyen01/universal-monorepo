export type AuthenticatedRole =
  | "USER"
  | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthenticatedRole;
}
