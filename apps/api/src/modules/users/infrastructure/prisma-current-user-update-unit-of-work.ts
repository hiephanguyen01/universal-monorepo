import { Injectable } from "@nestjs/common";

import { DuplicateIdempotencyKeyError } from "@/common/idempotency/duplicate-idempotency-key.error";
import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/infrastructure/prisma/prisma.service";

import { UserVersionConflictError } from "../application/errors/user-version-conflict.error";
import { UserOutputMapper } from "../application/mappers/user-output.mapper";
import type {
  CurrentUserUpdateTransactionInput,
  CurrentUserUpdateUnitOfWork,
} from "../application/ports/current-user-update-unit-of-work.port";
import { UserMapper } from "./mappers/user.mapper";

@Injectable()
export class PrismaCurrentUserUpdateUnitOfWork
  implements CurrentUserUpdateUnitOfWork
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    input: CurrentUserUpdateTransactionInput,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.idempotencyRecord.create({
            data: {
              scope: input.idempotency.scope,
              key: input.idempotency.key,
              requestHash:
                input.idempotency.requestHash,
            },
          });

          const data =
            UserMapper.toPersistence(
              input.user,
            );

          const record =
            input.changed
              ? await tx.user.update({
                  where: {
                    id: data.id,
                    version: data.version,
                  },
                  data: {
                    email: data.email,
                    passwordHash:
                      data.passwordHash,
                    fullName: data.fullName,
                    role: data.role,
                    status: data.status,
                    updatedAt:
                      data.updatedAt,
                    version: {
                      increment: 1,
                    },
                  },
                })
              : await tx.user.findFirst({
                  where: {
                    id: data.id,
                    version: data.version,
                  },
                });

          if (!record) {
            throw new UserVersionConflictError();
          }

          const output =
            UserOutputMapper.toOutput(
              UserMapper.toDomain(
                record,
              ),
            );

          await tx.idempotencyRecord.update({
            where: {
              scope_key: {
                scope:
                  input.idempotency.scope,
                key:
                  input.idempotency.key,
              },
            },
            data: {
              response:
                output as Prisma.InputJsonObject,
            },
          });

          return output;
        },
      );
    } catch (error) {
      if (
        error instanceof
        UserVersionConflictError
      ) {
        throw error;
      }

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DuplicateIdempotencyKeyError();
      }

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new UserVersionConflictError();
      }

      throw error;
    }
  }
}
