import { Injectable } from "@nestjs/common";

import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { UserVersionConflictError } from "../application/errors/user-version-conflict.error";
import type { User } from "../domain/entities/user.entity";
import type {
  FindUsersInput,
  UserRepository,
} from "../domain/repositories/user.repository";

import type { Email } from "../domain/value-objects/email.vo";

import type { UserId } from "../domain/value-objects/user-id.vo";

import { UserMapper } from "./mappers/user.mapper";

@Injectable()
type UserPrismaClient = Pick<PrismaClient, "user">;

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: UserPrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: {
        id: id.value,
      },
    });

    if (!record) {
      return null;
    }

    return UserMapper.toDomain(record);
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

    return UserMapper.toDomain(record);
  }

  async findMany(input: FindUsersInput): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      skip: input.skip,

      take: input.take,

      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map(UserMapper.toDomain);
  }

  count(): Promise<number> {
    return this.prisma.user.count();
  }

  async create(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    const record = await this.prisma.user.create({
      data,
    });

    return UserMapper.toDomain(record);
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    try {
      const record = await this.prisma.user.update({
        where: {
          id: data.id,

          version: data.version,
        },

        data: {
          email: data.email,

          passwordHash: data.passwordHash,

          fullName: data.fullName,

          role: data.role,

          status: data.status,

          updatedAt: data.updatedAt,

          version: {
            increment: 1,
          },
        },
      });

      return UserMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new UserVersionConflictError();
      }

      throw error;
    }
  }
}
