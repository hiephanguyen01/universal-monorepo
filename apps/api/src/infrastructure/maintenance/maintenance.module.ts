import { Module } from "@nestjs/common";

import { PrismaModule } from "@/infrastructure/prisma/prisma.module";

import { TechnicalDataRetentionWorker } from "./technical-data-retention-worker";

@Module({
  imports: [PrismaModule],
  providers: [
    TechnicalDataRetentionWorker,
  ],
  exports: [
    TechnicalDataRetentionWorker,
  ],
})
export class MaintenanceModule {}
