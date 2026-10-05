import type {
  UserRole,
  UserStatus,
} from "../../domain/entities/user.entity";

export interface UserOutput {
  id: string;

  email: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;

  version: number;

  createdAt: string;

  updatedAt: string;
}