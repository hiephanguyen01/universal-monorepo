export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: UserRole;
  }): Promise<User>;
  updateProfile(id: string, input: { fullName: string }): Promise<User>;
}
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
