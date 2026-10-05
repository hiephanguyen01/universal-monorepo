import { Injectable } from "@nestjs/common";

import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

import { UserMapper } from "@/modules/users/infrastructure/mappers/user.mapper";

import { DuplicateUserEmailError } from "@/modules/users/application/errors/duplicate-user-email.error";
import type {
  RegisterTransactionInput,
  RegistrationUnitOfWork,
} from "../../application/ports/registration-unit-of-work.port";

type RegistrationPrismaClient = Pick<PrismaClient, "$transaction">;

@Injectable()
export class PrismaRegistrationUnitOfWork implements RegistrationUnitOfWork {
  constructor(private readonly prisma: RegistrationPrismaClient) {}

  async execute(input: RegisterTransactionInput) {
    try {
      return await this.prisma.$transaction(async (tx) => {
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
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new DuplicateUserEmailError();
      }

      throw error;
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== "P2002") {
      return false;
    }

    const target = error.meta?.target;

    if (Array.isArray(target)) {
      return target.includes("email");
    }

    if (typeof target === "string") {
      return target.includes("email");
    }

    return false;
  }
}
