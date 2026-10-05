import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";

import { DOMAIN_EVENT_DISPATCHER } from "@/common/common.tokens";

import { DomainEventRegistry } from "@/common/infrastructure/events/domain-event-registry";

import type { DomainEventDispatcher } from "@/common/ports/domain-event-dispatcher.port";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

const POLL_INTERVAL_MS = 1_000;

const CLAIM_TIMEOUT_MS = 60_000;

const MAX_ATTEMPTS = 5;

const BASE_RETRY_MS = 5_000;

const MAX_RETRY_MS = 60_000;

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  private running = false;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(DomainEventRegistry)
    private readonly registry: DomainEventRegistry,

    @Inject(DOMAIN_EVENT_DISPATCHER)
    private readonly dispatcher: DomainEventDispatcher,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.runSafely();
    }, POLL_INTERVAL_MS);

    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);

      this.timer = null;
    }
  }

  async processOnce(now = new Date()): Promise<void> {
    const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS);

    const events = await this.prisma.outboxEvent.findMany({
      where: {
        processedAt: null,

        failedAt: null,

        nextAttemptAt: {
          lte: now,
        },

        OR: [
          {
            processingAt: null,
          },
          {
            processingAt: {
              lt: staleBefore,
            },
          },
        ],
      },

      orderBy: {
        createdAt: "asc",
      },

      take: 20,
    });

    for (const event of events) {
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,

          processedAt: null,

          failedAt: null,

          nextAttemptAt: {
            lte: now,
          },

          OR: [
            {
              processingAt: null,
            },
            {
              processingAt: {
                lt: staleBefore,
              },
            },
          ],
        },

        data: {
          processingAt: now,

          attempts: {
            increment: 1,
          },
        },
      });

      if (claimed.count !== 1) {
        continue;
      }

      const attempt = event.attempts + 1;

      try {
        const domainEvent = this.registry.deserialize(
          event.eventName,
          event.payload,
          event.occurredAt,
        );

        await this.dispatcher.dispatch(domainEvent);

        await this.prisma.outboxEvent.update({
          where: {
            id: event.id,
          },

          data: {
            processedAt: now,

            processingAt: null,

            lastError: null,
          },
        });
      } catch (error) {
        const failed = attempt >= MAX_ATTEMPTS;

        const retryDelay = Math.min(
          MAX_RETRY_MS,

          BASE_RETRY_MS * 2 ** Math.max(0, attempt - 1),
        );

        await this.prisma.outboxEvent.update({
          where: {
            id: event.id,
          },

          data: {
            processingAt: null,

            lastError: this.getErrorMessage(error),

            failedAt: failed ? now : null,

            nextAttemptAt: new Date(now.getTime() + retryDelay),
          },
        });
      }
    }
  }

  private async runSafely(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      await this.processOnce();
    } catch (error) {
      console.error("[OUTBOX]", error);
    } finally {
      this.running = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    return message.slice(0, 2_000);
  }
}
