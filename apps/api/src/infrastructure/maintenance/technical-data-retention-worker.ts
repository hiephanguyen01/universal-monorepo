import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";

import { PrismaService } from "@/infrastructure/prisma/prisma.service";

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

const CLEANUP_INTERVAL_MS = HOUR_MS;
const OUTBOX_PROCESSED_RETENTION_MS = 7 * DAY_MS;
const OUTBOX_FAILED_RETENTION_MS = 30 * DAY_MS;
const INBOX_RETENTION_MS = 7 * DAY_MS;
const IDEMPOTENCY_RETENTION_MS = DAY_MS;

export interface TechnicalDataCleanupResult {
  outboxDeleted: number;
  inboxDeleted: number;
  idempotencyDeleted: number;
}

@Injectable()
export class TechnicalDataRetentionWorker
  implements OnModuleInit, OnModuleDestroy
{
  private timer:
    ReturnType<typeof setInterval> | null =
      null;

  private running =
    false;

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  onModuleInit(): void {
    this.timer =
      setInterval(() => {
        void this.runSafely();
      }, CLEANUP_INTERVAL_MS);

    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(
        this.timer,
      );

      this.timer =
        null;
    }
  }

  async cleanupOnce(
    now = new Date(),
  ): Promise<TechnicalDataCleanupResult> {
    const [
      outbox,
      inbox,
      idempotency,
    ] =
      await Promise.all([
        this.prisma.outboxEvent.deleteMany({
          where: {
            OR: [
              {
                processedAt: {
                  lt:
                    new Date(
                      now.getTime() -
                        OUTBOX_PROCESSED_RETENTION_MS,
                    ),
                },
              },
              {
                failedAt: {
                  lt:
                    new Date(
                      now.getTime() -
                        OUTBOX_FAILED_RETENTION_MS,
                    ),
                },
              },
            ],
          },
        }),
        this.prisma.inboxEvent.deleteMany({
          where: {
            processedAt: {
              lt:
                new Date(
                  now.getTime() -
                    INBOX_RETENTION_MS,
                ),
            },
          },
        }),
        this.prisma.idempotencyRecord.deleteMany({
          where: {
            createdAt: {
              lt:
                new Date(
                  now.getTime() -
                    IDEMPOTENCY_RETENTION_MS,
                ),
            },
          },
        }),
      ]);

    return {
      outboxDeleted:
        outbox.count,
      inboxDeleted:
        inbox.count,
      idempotencyDeleted:
        idempotency.count,
    };
  }

  private async runSafely(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running =
      true;

    try {
      await this.cleanupOnce();
    } catch (error) {
      console.error(
        "[TECHNICAL_DATA_RETENTION]",
        error,
      );
    } finally {
      this.running =
        false;
    }
  }
}
