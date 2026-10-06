import { Module } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";

import { PrismaModule } from "@/infrastructure/prisma/prisma.module";

import { InboxProcessor } from "./inbox-processor";
import { OutboxWorker } from "./outbox-worker";

@Module({
  imports: [CommonModule, PrismaModule],

  providers: [InboxProcessor, OutboxWorker],

  exports: [OutboxWorker],
})
export class OutboxModule {}
