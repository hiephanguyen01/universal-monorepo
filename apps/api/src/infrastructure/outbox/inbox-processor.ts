import { Inject, Injectable } from "@nestjs/common";

import type { DomainEvent } from "@/common/domain/domain-event";

import type { RegisteredDomainEventHandler } from "@/common/domain/registered-domain-event-handler";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

const CLAIM_TIMEOUT_MS = 60_000;
@Injectable()
export class InboxProcessor {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async process(
    eventId: string,

    event: DomainEvent,

    handler: RegisteredDomainEventHandler,

    now = new Date(),
  ): Promise<void> {
    await this.prisma.inboxEvent.upsert({
      where: {
        eventId_handlerName: {
          eventId,

          handlerName: handler.handlerName,
        },
      },

      create: {
        eventId,

        handlerName: handler.handlerName,
      },

      update: {},
    });

    const current = await this.prisma.inboxEvent.findUniqueOrThrow({
      where: {
        eventId_handlerName: {
          eventId,

          handlerName: handler.handlerName,
        },
      },
    });

    if (current.processedAt) {
      return;
    }

    const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS);

    const claimed = await this.prisma.inboxEvent.updateMany({
      where: {
        id: current.id,

        processedAt: null,

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
      return;
    }

    try {
      await handler.handle(event, {
        eventId,
      });

      await this.prisma.inboxEvent.update({
        where: {
          id: current.id,
        },

        data: {
          processedAt: now,

          processingAt: null,

          lastError: null,
        },
      });
    } catch (error) {
      await this.prisma.inboxEvent.update({
        where: {
          id: current.id,
        },

        data: {
          processingAt: null,

          lastError: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }
}
