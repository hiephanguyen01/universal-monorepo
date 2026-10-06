import { Injectable } from "@nestjs/common";

import type { DomainEvent } from "@/common/domain/domain-event";

import type { RegisteredDomainEventHandler } from "@/common/domain/registered-domain-event-handler";

@Injectable()
export class DomainEventHandlerRegistry {
  private readonly handlers = new Map<string, RegisteredDomainEventHandler[]>();

  register<TEvent extends DomainEvent>(
    eventName: string,

    handler: RegisteredDomainEventHandler<TEvent>,
  ): void {
    const handlers = this.handlers.get(eventName) ?? [];

    handlers.push(handler as RegisteredDomainEventHandler);

    this.handlers.set(eventName, handlers);
  }

  getHandlers(eventName: string): RegisteredDomainEventHandler[] {
    return this.handlers.get(eventName) ?? [];
  }
}
