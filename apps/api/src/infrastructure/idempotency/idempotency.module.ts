import { Module } from "@nestjs/common";

import { PrismaModule } from "@/infrastructure/prisma/prisma.module";

import {
  IDEMPOTENCY_REPOSITORY,
  PAYLOAD_HASHER,
} from "./idempotency.tokens";
import { PrismaIdempotencyRepository } from "./prisma-idempotency.repository";
import { Sha256PayloadHasher } from "./sha256-payload-hasher";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: IDEMPOTENCY_REPOSITORY,
      useClass: PrismaIdempotencyRepository,
    },
    {
      provide: PAYLOAD_HASHER,
      useClass: Sha256PayloadHasher,
    },
  ],
  exports: [
    IDEMPOTENCY_REPOSITORY,
    PAYLOAD_HASHER,
  ],
})
export class IdempotencyModule {}
