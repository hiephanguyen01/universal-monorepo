import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { TechnicalDataRetentionWorker } from "@/infrastructure/maintenance/technical-data-retention-worker";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe(
  "TechnicalDataRetentionWorker integration",
  () => {
    const prisma =
      createTestPrisma();

    const worker =
      new TechnicalDataRetentionWorker(
        prisma,
      );

    beforeAll(
      async () => {
        await prisma.$connect();
      },
    );

    beforeEach(
      async () => {
        await clearDatabase(
          prisma,
        );
      },
    );

    afterAll(
      async () => {
        await prisma.$disconnect();
      },
    );

    it(
      "removes expired technical records and keeps active or recent ones",
      async () => {
        const now =
          new Date(
            "2026-10-06T10:00:00.000Z",
          );

        const daysAgo = (
          days: number,
        ) =>
          new Date(
            now.getTime() -
              days *
                24 *
                60 *
                60 *
                1_000,
          );

        await prisma.outboxEvent.createMany({
          data: [
            {
              id:
                "outbox-processed-old",
              eventName:
                "test.event",
              payload: {},
              occurredAt:
                daysAgo(10),
              processedAt:
                daysAgo(8),
            },
            {
              id:
                "outbox-processed-recent",
              eventName:
                "test.event",
              payload: {},
              occurredAt:
                daysAgo(8),
              processedAt:
                daysAgo(6),
            },
            {
              id:
                "outbox-failed-old",
              eventName:
                "test.event",
              payload: {},
              occurredAt:
                daysAgo(40),
              failedAt:
                daysAgo(31),
            },
            {
              id:
                "outbox-failed-recent",
              eventName:
                "test.event",
              payload: {},
              occurredAt:
                daysAgo(35),
              failedAt:
                daysAgo(29),
            },
            {
              id:
                "outbox-pending-old",
              eventName:
                "test.event",
              payload: {},
              occurredAt:
                daysAgo(90),
            },
          ],
        });

        await prisma.inboxEvent.createMany({
          data: [
            {
              id:
                "inbox-old",
              eventId:
                "event-old",
              handlerName:
                "handler.v1",
              processedAt:
                daysAgo(8),
            },
            {
              id:
                "inbox-recent",
              eventId:
                "event-recent",
              handlerName:
                "handler.v1",
              processedAt:
                daysAgo(6),
            },
            {
              id:
                "inbox-pending",
              eventId:
                "event-pending",
              handlerName:
                "handler.v1",
              createdAt:
                daysAgo(30),
            },
          ],
        });

        await prisma.idempotencyRecord.createMany({
          data: [
            {
              id:
                "idempotency-old",
              scope:
                "scope",
              key:
                "old",
              requestHash:
                "hash",
              response: {},
              createdAt:
                new Date(
                  now.getTime() -
                    25 *
                      60 *
                      60 *
                      1_000,
                ),
            },
            {
              id:
                "idempotency-recent",
              scope:
                "scope",
              key:
                "recent",
              requestHash:
                "hash",
              response: {},
              createdAt:
                new Date(
                  now.getTime() -
                    23 *
                      60 *
                      60 *
                      1_000,
                ),
            },
          ],
        });

        const result =
          await worker.cleanupOnce(
            now,
          );

        expect(
          result,
        ).toEqual({
          outboxDeleted:
            2,
          inboxDeleted:
            1,
          idempotencyDeleted:
            1,
        });

        expect(
          (
            await prisma.outboxEvent.findMany({
              select: {
                id: true,
              },
              orderBy: {
                id: "asc",
              },
            })
          ).map(
            (item) =>
              item.id,
          ),
        ).toEqual([
          "outbox-failed-recent",
          "outbox-pending-old",
          "outbox-processed-recent",
        ]);

        expect(
          (
            await prisma.inboxEvent.findMany({
              select: {
                id: true,
              },
              orderBy: {
                id: "asc",
              },
            })
          ).map(
            (item) =>
              item.id,
          ),
        ).toEqual([
          "inbox-pending",
          "inbox-recent",
        ]);

        expect(
          (
            await prisma.idempotencyRecord.findMany({
              select: {
                id: true,
              },
            })
          ).map(
            (item) =>
              item.id,
          ),
        ).toEqual([
          "idempotency-recent",
        ]);
      },
    );
  },
);
