import {
  Injectable,
} from "@nestjs/common";

import type {
  DomainEvent,
} from "@/common/domain/domain-event";

import type {
  DomainEventDispatcher,
} from "@/common/ports/domain-event-dispatcher.port";

type EventKey = {
  readonly prototype:
    DomainEvent;
};

type EventConstructor<
  TEvent extends DomainEvent,
> = {
  readonly prototype:
    TEvent;
};

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
      EventKey,
      EventHandler[]
    >();

  register<
    TEvent extends DomainEvent,
  >(
    eventType:
      EventConstructor<TEvent>,

    handler:
      (
        event: TEvent,
      ) => Promise<void>,
  ): void {
    const handlers =
      this.handlers.get(
        eventType,
      ) ?? [];

    handlers.push(
      handler as EventHandler,
    );

    this.handlers.set(
      eventType,
      handlers,
    );
  }

  async dispatch(
    event: DomainEvent,
  ): Promise<void> {
    const eventType =
      event.constructor as unknown as
        EventKey;

    const handlers =
      this.handlers.get(
        eventType,
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
