import { Module } from "@nestjs/common";

import { DomainEventHandlerRegistry } from "./infrastructure/events/domain-event-handler-registry";
import { DomainEventRegistry } from "./infrastructure/events/domain-event-registry";
import { InMemoryDomainEventDispatcher } from "./infrastructure/events/in-memory-domain-event-dispatcher";
import { UuidIdGenerator } from "./infrastructure/id/uuid-id-generator";
import { SystemClock } from "./infrastructure/time/system-clock";
import { CLOCK, DOMAIN_EVENT_DISPATCHER, ID_GENERATOR } from "./common.tokens";

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
    DomainEventHandlerRegistry,
  ],
  exports: [
    ID_GENERATOR,
    CLOCK,
    DOMAIN_EVENT_DISPATCHER,
    DomainEventRegistry,
    InMemoryDomainEventDispatcher,
    DomainEventHandlerRegistry,
  ],
})
export class CommonModule {}
