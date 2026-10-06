import type { DomainEvent } from "./domain-event";
import type { DomainEventHandler } from "./domain-event-handler";

export interface RegisteredDomainEventHandler<
  TEvent extends DomainEvent = DomainEvent,
> extends DomainEventHandler<TEvent> {
  readonly handlerName: string;
}
