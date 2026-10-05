import { Module } from "@nestjs/common";

import { CLOCK, DOMAIN_EVENT_DISPATCHER, ID_GENERATOR } from "./common.tokens";
import { UuidIdGenerator } from "./infrastructure/id/uuid-id-generator";
import { SystemClock } from "./infrastructure/time/system-clock";

import { InMemoryDomainEventDispatcher } from "./infrastructure/events/in-memory-domain-event-dispatcher";

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
    {
      provide: DOMAIN_EVENT_DISPATCHER,

      useClass: InMemoryDomainEventDispatcher,
    },
  ],
  exports: [ID_GENERATOR, CLOCK, DOMAIN_EVENT_DISPATCHER],
})
export class CommonModule {}
