import {
  Injectable,
} from "@nestjs/common";

import type {
  DomainEvent,
} from "@/common/domain/domain-event";

import type {
  DomainEventDispatcher,
} from "@/common/ports/domain-event-dispatcher.port";

type EventHandler =
  (
    event: DomainEvent,
  ) => Promise<void>;

@Injectable()
export class InMemoryDomainEventDispatcher
  implements DomainEventDispatcher
{
  private readonly handlers =
    new Map<
      string,
      EventHandler[]
    >();

  register<
    TEvent extends DomainEvent,
  >(
    eventName: string,

    handler:
      (
        event: TEvent,
      ) => Promise<void>,
  ): void {
    const handlers =
      this.handlers.get(
        eventName,
      ) ?? [];

    handlers.push(
      handler as EventHandler,
    );

    this.handlers.set(
      eventName,
      handlers,
    );
  }

  async dispatch(
    event: DomainEvent,
  ): Promise<void> {
    const handlers =
      this.handlers.get(
        event.eventName,
      ) ?? [];

    await Promise.all(
      handlers.map(
        (handler) =>
          handler(
            event,
          ),
      ),
    );
  }
}
