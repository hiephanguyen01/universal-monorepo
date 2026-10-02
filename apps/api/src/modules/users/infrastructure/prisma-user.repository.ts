import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import { User } from "@/modules/users/domain/entities/user.entity";
import type {
  CreateUserInput,
  FindUsersInput,
  UpdateUserProfileInput,
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";

@Injectable()
export class PrismaUserRepository
  implements UserRepository
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findById(
    id: string,
  ): Promise<User | null> {
    const record =
      await this.prisma.user.findUnique({
        where: { id },
      });

    return record
      ? new User(record)
      : null;
  }

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    const record =
      await this.prisma.user.findUnique({
        where: { email },
      });

    return record
      ? new User(record)
      : null;
  }

  async findMany(
    input: FindUsersInput,
  ): Promise<User[]> {
    const records =
      await this.prisma.user.findMany({
        skip: input.skip,
        take: input.take,
        orderBy: {
          createdAt: "desc",
        },
      });

    return records.map(
      (record) =>
        new User(record),
    );
  }

  count(): Promise<number> {
    return this.prisma.user.count();
  }

  async create(
    input: CreateUserInput,
  ): Promise<User> {
    const record =
      await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash:
            input.passwordHash,
          fullName:
            input.fullName,
          role:
            input.role ?? "USER",
        },
      });

    return new User(record);
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    const record =
      await this.prisma.user.update({
        where: { id },
        data: {
          fullName:
            input.fullName,
        },
      });

    return new User(record);
  }
}
