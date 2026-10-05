import type { DomainEvent } from "../domain/domain-event";

export interface DomainEventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
}
