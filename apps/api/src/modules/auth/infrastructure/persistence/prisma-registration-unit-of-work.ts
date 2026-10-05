import { Injectable } from "@nestjs/common";

import { Prisma } from "@/generated/prisma/client";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

import { DuplicateUserEmailError } from "@/modules/users/application/errors/duplicate-user-email.error";

import { UserMapper } from "@/modules/users/infrastructure/mappers/user.mapper";

import type {
  RegisterTransactionInput,
  RegistrationUnitOfWork,
} from "../../application/ports/registration-unit-of-work.port";

@Injectable()
export class PrismaRegistrationUnitOfWork
  implements RegistrationUnitOfWork
{
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async execute(
    input: RegisterTransactionInput,
  ) {
    try {
      return await this.prisma
        .$transaction(
          async (tx) => {
            const userData =
              UserMapper
                .toPersistence(
                  input.user,
                );

            const userRecord =
              await tx.user
                .create({
                  data:
                    userData,
                });

            await tx.refreshToken
              .create({
                data: {
                  id:
                    input.refreshToken
                      .id,

                  userId:
                    input.refreshToken
                      .userId,

                  tokenHash:
                    input.refreshToken
                      .tokenHash,

                  expiresAt:
                    input.refreshToken
                      .expiresAt,
                },
              });

            return UserMapper
              .toDomain(
                userRecord,
              );
          },
        );
    } catch (error) {
      if (
        this.isDuplicateEmailError(
          error,
        )
      ) {
        throw new DuplicateUserEmailError();
      }

      throw error;
    }
  }

  private isDuplicateEmailError(
    error: unknown,
  ): boolean {
    if (
      !(
        error instanceof
        Prisma.PrismaClientKnownRequestError
      ) ||
      error.code !== "P2002"
    ) {
      return false;
    }

    const target =
      error.meta?.target;

    if (
      this.containsEmailField(
        target,
      )
    ) {
      return true;
    }

    const driverAdapterError =
      error.meta
        ?.driverAdapterError;

    if (
      !this.isRecord(
        driverAdapterError,
      )
    ) {
      return (
        error.meta?.modelName ===
        "User"
      );
    }

    const cause =
      driverAdapterError
        .cause;

    if (
      !this.isRecord(
        cause,
      )
    ) {
      return (
        error.meta?.modelName ===
        "User"
      );
    }

    const constraint =
      cause.constraint;

    if (
      this.isRecord(
        constraint,
      ) &&
      this.containsEmailField(
        constraint.fields,
      )
    ) {
      return true;
    }

    return (
      error.meta?.modelName ===
      "User"
    );
  }

  private containsEmailField(
    value: unknown,
  ): boolean {
    if (
      Array.isArray(
        value,
      )
    ) {
      return value.some(
        (field) =>
          typeof field ===
            "string" &&
          field.replaceAll(
            '"',
            "",
          ) === "email",
      );
    }

    return (
      typeof value ===
        "string" &&
      value.includes(
        "email",
      )
    );
  }

  private isRecord(
    value: unknown,
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value ===
        "object" &&
      value !== null
    );
  }
}
