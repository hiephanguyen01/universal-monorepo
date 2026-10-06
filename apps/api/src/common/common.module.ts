import { Module } from "@nestjs/common";

import { DomainEventRegistry } from "./infrastructure/events/domain-event-registry";

import { InMemoryDomainEventDispatcher } from "./infrastructure/events/in-memory-domain-event-dispatcher";

import { UuidIdGenerator } from "./infrastructure/id/uuid-id-generator";

import { SystemClock } from "./infrastructure/time/system-clock";

import { CLOCK, DOMAIN_EVENT_DISPATCHER, ID_GENERATOR } from "./common.tokens";

import { DomainEventHandlerRegistry } from "./infrastructure/events/domain-event-handler-registry";

@Module({
  providers: [
    {
      provide: ID_GENERATOR,
      useClass: UuidIdGenerator,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    DomainEventRegistry,
    InMemoryDomainEventDispatcher,
    {
      provide: DOMAIN_EVENT_DISPATCHER,
      useExisting: InMemoryDomainEventDispatcher,
    },
    DomainEventRegistry,

    DomainEventHandlerRegistry,
  ],
  exports: [
    ID_GENERATOR,
    CLOCK,
    DOMAIN_EVENT_DISPATCHER,
    DomainEventRegistry,
    InMemoryDomainEventDispatcher,
    DomainEventRegistry,

    DomainEventHandlerRegistry,
  ],
})
export class CommonModule {}
