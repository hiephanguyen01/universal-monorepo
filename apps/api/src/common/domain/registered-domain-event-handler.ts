import type { DomainEvent } from "./domain-event";

import type { DomainEventHandlerContext } from "./domain-event-handler-context";

export interface RegisteredDomainEventHandler<
  TEvent extends DomainEvent = DomainEvent,
> {
  readonly handlerName: string;

  handle(
    event: TEvent,

    context: DomainEventHandlerContext,
  ): Promise<void>;
}
