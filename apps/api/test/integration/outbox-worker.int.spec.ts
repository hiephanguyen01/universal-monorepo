import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  DomainEventRegistry,
} from "@/common/infrastructure/events/domain-event-registry";

import {
  InMemoryDomainEventDispatcher,
} from "@/common/infrastructure/events/in-memory-domain-event-dispatcher";

import {
  OutboxWorker,
} from "@/infrastructure/outbox/outbox-worker";

import {
  UserRegisteredEvent,
} from "@/modules/users/domain/events/user-registered.event";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe(
  "OutboxWorker integration",
  () => {
    const prisma =
      createTestPrisma();

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

    function createWorker(
      handler:
        (
          event:
            UserRegisteredEvent,
        ) => Promise<void>,
    ) {
      const registry =
        new DomainEventRegistry();

      const dispatcher =
        new InMemoryDomainEventDispatcher();

      registry.register(
        UserRegisteredEvent
          .eventName,

        (
          payload,
          occurredAt,
        ) =>
          UserRegisteredEvent
            .fromPrimitives(
              payload,
              occurredAt,
            ),
      );

      dispatcher.register<
        UserRegisteredEvent
      >(
        UserRegisteredEvent
          .eventName,

        handler,
      );

      return new OutboxWorker(
        prisma,
        registry,
        dispatcher,
      );
    }

    it(
      "dispatches and marks an outbox event as processed",
      async () => {
        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        const handler =
          vi.fn(
            () =>
              Promise.resolve(),
          );

        const worker =
          createWorker(
            handler,
          );

        const event =
          await prisma.outboxEvent
            .create({
              data: {
                eventName:
                  UserRegisteredEvent
                    .eventName,

                payload: {
                  userId:
                    "user-1",

                  email:
                    "alice@example.com",
                },

                occurredAt:
                  now,

                nextAttemptAt:
                  now,
              },
            });

        await worker.processOnce(
          now,
        );

        const saved =
          await prisma.outboxEvent
            .findUniqueOrThrow({
              where: {
                id:
                  event.id,
              },
            });

        expect(
          handler,
        ).toHaveBeenCalledOnce();

        expect(
          saved.processedAt,
        ).toEqual(
          now,
        );

        expect(
          saved.processingAt,
        ).toBeNull();

        expect(
          saved.attempts,
        ).toBe(1);

        expect(
          saved.lastError,
        ).toBeNull();

        expect(
          saved.failedAt,
        ).toBeNull();
      },
    );

    it(
      "releases a failed event for a later retry",
      async () => {
        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        const worker =
          createWorker(
            () =>
              Promise.reject(
                new Error(
                  "Email provider unavailable",
                ),
              ),
          );

        const event =
          await prisma.outboxEvent
            .create({
              data: {
                eventName:
                  UserRegisteredEvent
                    .eventName,

                payload: {
                  userId:
                    "user-1",

                  email:
                    "alice@example.com",
                },

                occurredAt:
                  now,

                nextAttemptAt:
                  now,
              },
            });

        await worker.processOnce(
          now,
        );

        const saved =
          await prisma.outboxEvent
            .findUniqueOrThrow({
              where: {
                id:
                  event.id,
              },
            });

        expect(
          saved.processedAt,
        ).toBeNull();

        expect(
          saved.processingAt,
        ).toBeNull();

        expect(
          saved.attempts,
        ).toBe(1);

        expect(
          saved.lastError,
        ).toBe(
          "Email provider unavailable",
        );

        expect(
          saved.failedAt,
        ).toBeNull();

        expect(
          saved.nextAttemptAt
            .getTime(),
        ).toBeGreaterThan(
          now.getTime(),
        );
      },
    );
  },
);
