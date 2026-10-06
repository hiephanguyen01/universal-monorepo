import { Injectable } from "@nestjs/common";

import type {
  IdempotencyRecord,
  IdempotencyRepository,
} from "@/common/ports/idempotency-repository.port";
import { PrismaService } from "@/infrastructure/prisma/prisma.service";

@Injectable()
export class PrismaIdempotencyRepository
  implements IdempotencyRepository
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async find(
    scope: string,
    key: string,
  ): Promise<IdempotencyRecord | null> {
    const record =
      await this.prisma.idempotencyRecord.findUnique({
        where: {
          scope_key: {
            scope,
            key,
          },
        },
      });

    if (!record) {
      return null;
    }

    return {
      scope: record.scope,
      key: record.key,
      requestHash: record.requestHash,
      response: record.response,
    };
  }
}
