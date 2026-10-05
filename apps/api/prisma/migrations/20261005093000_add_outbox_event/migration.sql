CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutboxEvent_processedAt_failedAt_nextAttemptAt_idx"
ON "OutboxEvent"("processedAt", "failedAt", "nextAttemptAt");

CREATE INDEX "OutboxEvent_processingAt_idx"
ON "OutboxEvent"("processingAt");

CREATE INDEX "OutboxEvent_createdAt_idx"
ON "OutboxEvent"("createdAt");
