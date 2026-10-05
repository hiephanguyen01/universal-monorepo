import {
  Injectable,
} from "@nestjs/common";

import type {
  PrismaClient,
} from "@/generated/prisma/client";

import type {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
  RotateRefreshTokenInput,
} from "@/modules/auth/application/ports/refresh-token.repository";

type RefreshTokenPrismaClient = Pick<
  PrismaClient,
  "refreshToken" | "$transaction"
>;

@Injectable()
export class PrismaRefreshTokenRepository
  implements RefreshTokenRepository
{
  constructor(
    private readonly prisma:
      RefreshTokenPrismaClient,
  ) {}

  create(
    input: CreateRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken
      .create({
        data: {
          id:
            input.id,

          userId:
            input.userId,

          tokenHash:
            input.tokenHash,

          expiresAt:
            input.expiresAt,
        },
      });
  }

  findById(
    id: string,
  ): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken
      .findUnique({
        where: {
          id,
        },
      });
  }

  async revoke(
    id: string,
  ): Promise<void> {
    await this.prisma.refreshToken
      .updateMany({
        where: {
          id,
          revokedAt:
            null,
        },

        data: {
          revokedAt:
            new Date(),
        },
      });
  }

  async revokeAllByUserId(
    userId: string,
  ): Promise<void> {
    await this.prisma.refreshToken
      .updateMany({
        where: {
          userId,

          revokedAt:
            null,
        },

        data: {
          revokedAt:
            new Date(),
        },
      });
  }

  rotate(
    input: RotateRefreshTokenInput,
  ): Promise<boolean> {
    return this.prisma
      .$transaction(
        async (tx) => {
          const result =
            await tx.refreshToken
              .updateMany({
                where: {
                  id:
                    input.currentSessionId,

                  revokedAt:
                    null,
                },

                data: {
                  revokedAt:
                    new Date(),
                },
              });

          if (
            result.count !== 1
          ) {
            return false;
          }

          await tx.refreshToken
            .create({
              data: {
                id:
                  input.nextSession.id,

                userId:
                  input.nextSession.userId,

                tokenHash:
                  input.nextSession.tokenHash,

                expiresAt:
                  input.nextSession.expiresAt,
              },
            });

          return true;
        },
      );
  }
}
