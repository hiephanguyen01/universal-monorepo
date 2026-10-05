import type { DomainEvent } from "./domain-event";

export interface DomainEventHandler<TEvent extends DomainEvent> {
  handle(event: TEvent): Promise<void>;
}
