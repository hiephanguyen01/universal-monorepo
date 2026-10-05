import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

import { UserMapper } from "@/modules/users/infrastructure/mappers/user.mapper";

import type {
  RegisterTransactionInput,
  RegistrationUnitOfWork,
} from "../../application/ports/registration-unit-of-work.port";

@Injectable()
export class PrismaRegistrationUnitOfWork implements RegistrationUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: RegisterTransactionInput) {
    return this.prisma.$transaction(async (tx) => {
      const userData = UserMapper.toPersistence(input.user);

      const userRecord = await tx.user.create({
        data: userData,
      });

      await tx.refreshToken.create({
        data: {
          id: input.refreshToken.id,

          userId: input.refreshToken.userId,

          tokenHash: input.refreshToken.tokenHash,

          expiresAt: input.refreshToken.expiresAt,
        },
      });

      return UserMapper.toDomain(userRecord);
    });
  }
}
