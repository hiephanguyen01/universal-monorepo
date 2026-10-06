CREATE TABLE "InboxEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "processingAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxEvent_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"InboxEvent_eventId_handlerName_key"
ON "InboxEvent"(
    "eventId",
    "handlerName"
);

CREATE INDEX
"InboxEvent_processedAt_idx"
ON "InboxEvent"(
    "processedAt"
);

CREATE INDEX
"InboxEvent_processingAt_idx"
ON "InboxEvent"(
    "processingAt"
);