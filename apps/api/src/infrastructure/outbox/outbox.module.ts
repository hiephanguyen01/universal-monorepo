import {
  Module,
} from "@nestjs/common";

import {
  CommonModule,
} from "@/common/common.module";

import {
  PrismaModule,
} from "@/infrastructure/prisma/prisma.module";

import {
  OutboxWorker,
} from "./outbox-worker";

@Module({
  imports: [
    CommonModule,
    PrismaModule,
  ],

  providers: [
    OutboxWorker,
  ],

  exports: [
    OutboxWorker,
  ],
})
export class OutboxModule {}
