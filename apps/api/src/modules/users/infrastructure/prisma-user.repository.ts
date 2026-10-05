import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import { User } from "@/modules/users/domain/entities/user.entity";
import type {
  FindUsersInput,
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";
import { Injectable } from "@nestjs/common";
import { Email } from "../domain/value-objects/email.vo";

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

    return User.restore(record);
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

    return records.map((record) => User.restore(record));
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

    return User.restore(record);
  }
}
