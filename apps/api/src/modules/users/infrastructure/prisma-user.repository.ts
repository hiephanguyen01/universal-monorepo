import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

import { User } from "@/modules/users/domain/entities/user.entity";

import type {
  UserRole,
  UserStatus,
} from "@/modules/users/domain/entities/user.entity";

import type {
  FindUsersInput,
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";

import { Email } from "@/modules/users/domain/value-objects/email.vo";

interface PrismaUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: {
        email: email.value,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findMany(input: FindUsersInput): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      skip: input.skip,

      take: input.take,

      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map((record) => this.toDomain(record));
  }

  count(): Promise<number> {
    return this.prisma.user.count();
  }

  async create(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        id: user.id,

        email: user.email.value,

        passwordHash: user.passwordHash,

        fullName: user.fullName,

        role: user.role,

        status: user.status,

        createdAt: user.createdAt,

        updatedAt: user.updatedAt,
      },
    });

    return this.toDomain(record);
  }

  async save(user: User): Promise<User> {
    const record = await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        fullName: user.fullName,

        role: user.role,

        status: user.status,
      },
    });

    return this.toDomain(record);
  }

  private toDomain(record: PrismaUserRecord): User {
    return User.restore({
      id: record.id,

      email: Email.create(record.email),

      passwordHash: record.passwordHash,

      fullName: record.fullName,

      role: record.role,

      status: record.status,

      createdAt: record.createdAt,

      updatedAt: record.updatedAt,
    });
  }
}
