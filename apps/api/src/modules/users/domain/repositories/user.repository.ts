import type { User } from "../entities/user.entity";

import type { Email } from "../value-objects/email.vo";

export interface FindUsersInput {
  skip: number;
  take: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;

  findByEmail(email: Email): Promise<User | null>;

  findMany(input: FindUsersInput): Promise<User[]>;

  count(): Promise<number>;

  create(user: User): Promise<User>;

  save(user: User): Promise<User>;
}
