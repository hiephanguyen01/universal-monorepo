import { User } from "../../domain/entities/user.entity";

import type { UserRole, UserStatus } from "../../domain/entities/user.entity";

import { Email } from "../../domain/value-objects/email.vo";

import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UserPersistenceRecord {
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

export interface UserPersistenceData {
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

export class UserMapper {
  static toDomain(record: UserPersistenceRecord): User {
    return User.restore({
      id: UserId.create(record.id),

      email: Email.create(record.email),

      passwordHash: record.passwordHash,

      fullName: record.fullName,

      role: record.role,

      status: record.status,

      version: record.version,

      createdAt: record.createdAt,

      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(user: User): UserPersistenceData {
    return {
      id: user.id.value,

      email: user.email.value,

      passwordHash: user.passwordHash,

      fullName: user.fullName,

      role: user.role,

      status: user.status,

      version: user.version,

      createdAt: user.createdAt,

      updatedAt: user.updatedAt,
    };
  }
}
