import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { RegisteredDomainEventHandler } from "@/common/domain/registered-domain-event-handler";
import { DomainEventHandlerRegistry } from "@/common/infrastructure/events/domain-event-handler-registry";
import { DomainEventRegistry } from "@/common/infrastructure/events/domain-event-registry";
import { InboxProcessor } from "@/infrastructure/outbox/inbox-processor";
import { OutboxWorker } from "@/infrastructure/outbox/outbox-worker";
import { UserRegisteredEvent } from "@/modules/users/domain/events/user-registered.event";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe("OutboxWorker integration", () => {
  const prisma = createTestPrisma();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function createWorker(
    handlers: RegisteredDomainEventHandler<UserRegisteredEvent>[],
  ): OutboxWorker {
    const registry = new DomainEventRegistry();
    const handlerRegistry = new DomainEventHandlerRegistry();

    registry.register(
      UserRegisteredEvent.eventName,
      (payload, occurredAt) =>
        UserRegisteredEvent.fromPrimitives(payload, occurredAt),
    );

    for (const handler of handlers) {
      handlerRegistry.register(
        UserRegisteredEvent.eventName,
        handler,
      );
    }

    return new OutboxWorker(
      prisma,
      registry,
      handlerRegistry,
      new InboxProcessor(prisma),
    );
  }

  async function createOutboxEvent(now: Date) {
    return prisma.outboxEvent.create({
      data: {
        eventName: UserRegisteredEvent.eventName,
        payload: {
          userId: "user-1",
          email: "alice@example.com",
        },
        occurredAt: now,
        nextAttemptAt: now,
      },
    });
  }

  it("dispatches through inbox and marks the outbox event as processed", async () => {
    const now = new Date("2026-10-05T10:00:00.000Z");
    const handle = vi.fn(() => Promise.resolve());

    const worker = createWorker([
      {
        handlerName: "test.welcome.v1",
        handle,
      },
    ]);

    const event = await createOutboxEvent(now);

    await worker.processOnce(now);

    const saved = await prisma.outboxEvent.findUniqueOrThrow({
      where: {
        id: event.id,
      },
    });

    const inbox = await prisma.inboxEvent.findUniqueOrThrow({
      where: {
        eventId_handlerName: {
          eventId: event.id,
          handlerName: "test.welcome.v1",
        },
      },
    });

    expect(handle).toHaveBeenCalledOnce();
    expect(saved.processedAt).toEqual(now);
    expect(saved.processingAt).toBeNull();
    expect(saved.attempts).toBe(1);
    expect(saved.lastError).toBeNull();
    expect(saved.failedAt).toBeNull();
    expect(inbox.processedAt).toEqual(now);
    expect(inbox.processingAt).toBeNull();
    expect(inbox.attempts).toBe(1);
    expect(inbox.lastError).toBeNull();
  });

  it("releases a failed event for a later retry", async () => {
    const now = new Date("2026-10-05T10:00:00.000Z");

    const worker = createWorker([
      {
        handlerName: "test.failing.v1",
        handle: () =>
          Promise.reject(
            new Error("Email provider unavailable"),
          ),
      },
    ]);

    const event = await createOutboxEvent(now);

    await worker.processOnce(now);

    const saved = await prisma.outboxEvent.findUniqueOrThrow({
      where: {
        id: event.id,
      },
    });

    const inbox = await prisma.inboxEvent.findUniqueOrThrow({
      where: {
        eventId_handlerName: {
          eventId: event.id,
          handlerName: "test.failing.v1",
        },
      },
    });

    expect(saved.processedAt).toBeNull();
    expect(saved.processingAt).toBeNull();
    expect(saved.attempts).toBe(1);
    expect(saved.lastError).toBe("Email provider unavailable");
    expect(saved.failedAt).toBeNull();
    expect(saved.nextAttemptAt.getTime()).toBeGreaterThan(now.getTime());

    expect(inbox.processedAt).toBeNull();
    expect(inbox.processingAt).toBeNull();
    expect(inbox.attempts).toBe(1);
    expect(inbox.lastError).toBe("Email provider unavailable");
  });

  it("does not rerun a completed handler when a later handler is retried", async () => {
    const now = new Date("2026-10-05T10:00:00.000Z");
    const firstHandle = vi.fn(() => Promise.resolve());

    let shouldFail = true;
    const secondHandle = vi.fn(async () => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error("Temporary failure");
      }
    });

    const worker = createWorker([
      {
        handlerName: "test.first.v1",
        handle: firstHandle,
      },
      {
        handlerName: "test.second.v1",
        handle: secondHandle,
      },
    ]);

    const event = await createOutboxEvent(now);

    await worker.processOnce(now);
    await worker.processOnce(
      new Date(now.getTime() + 5_000),
    );

    const saved = await prisma.outboxEvent.findUniqueOrThrow({
      where: {
        id: event.id,
      },
    });

    const inboxEvents = await prisma.inboxEvent.findMany({
      where: {
        eventId: event.id,
      },
      orderBy: {
        handlerName: "asc",
      },
    });

    expect(firstHandle).toHaveBeenCalledOnce();
    expect(secondHandle).toHaveBeenCalledTimes(2);
    expect(saved.processedAt).not.toBeNull();
    expect(saved.attempts).toBe(2);
    expect(inboxEvents).toHaveLength(2);
    expect(inboxEvents.every((item) => item.processedAt !== null)).toBe(true);
  });
});
