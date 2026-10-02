import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import { User } from "@/modules/users/domain/entities/user.entity";
import type {
  CreateUserInput,
  FindUsersInput,
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";
import { Injectable } from "@nestjs/common";

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

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!record) {
      return null;
    }

    return User.restore(record);
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

  async create(input: CreateUserInput): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: input.email,

        passwordHash: input.passwordHash,

        fullName: input.fullName,

        role: input.role ?? "USER",
      },
    });

    return User.restore(record);
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
