import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import { User } from "@/modules/users/domain/entities/user.entity";
import type {
  CreateUserInput,
  UpdateUserProfileInput,
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? new User(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? new User(record) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        role: (input.role as any) ?? "USER",
      },
    });
    return new User(record);
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id },
      data: input,
    });
    return new User(record);
  }
}
