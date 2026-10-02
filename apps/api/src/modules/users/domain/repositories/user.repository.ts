import type {
  User,
  UserRole,
} from "../entities/user.entity";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
}

export interface UpdateUserProfileInput {
  fullName: string;
}

export interface UserRepository {
  findById(
    id: string,
  ): Promise<User | null>;

  findByEmail(
    email: string,
  ): Promise<User | null>;

  create(
    input: CreateUserInput,
  ): Promise<User>;

  updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<User>;
}
