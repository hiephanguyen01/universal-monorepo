import type { User, UserRole } from "../entities/user.entity";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
}


export interface FindUsersInput {
  skip: number;
  take: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findMany(input: FindUsersInput): Promise<User[]>;

  count(): Promise<number>;

  create(input: CreateUserInput): Promise<User>;

  save(user: User): Promise<User>;
}
