import { Injectable } from "@nestjs/common";

import type { DomainEvent } from "@/common/domain/domain-event";

type DomainEventFactory = (payload: unknown, occurredAt: Date) => DomainEvent;

@Injectable()
export class DomainEventRegistry {
  private readonly factories = new Map<string, DomainEventFactory>();

  register(eventName: string, factory: DomainEventFactory): void {
    this.factories.set(eventName, factory);
  }

  deserialize(
    eventName: string,
    payload: unknown,
    occurredAt: Date,
  ): DomainEvent {
    const factory = this.factories.get(eventName);

    if (!factory) {
      throw new Error(`No domain event factory registered for ${eventName}`);
    }

    return factory(payload, occurredAt);
  }
}
