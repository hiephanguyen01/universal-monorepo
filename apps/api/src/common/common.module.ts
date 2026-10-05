import { Module } from "@nestjs/common";

import {
  InMemoryDomainEventDispatcher,
} from "./infrastructure/events/in-memory-domain-event-dispatcher";

import {
  UuidIdGenerator,
} from "./infrastructure/id/uuid-id-generator";

import {
  SystemClock,
} from "./infrastructure/time/system-clock";

import {
  CLOCK,
  DOMAIN_EVENT_DISPATCHER,
  ID_GENERATOR,
} from "./common.tokens";

@Module({
  providers: [
    {
      provide:
        ID_GENERATOR,
      useClass:
        UuidIdGenerator,
    },
    {
      provide:
        CLOCK,
      useClass:
        SystemClock,
    },
    InMemoryDomainEventDispatcher,
    {
      provide:
        DOMAIN_EVENT_DISPATCHER,
      useExisting:
        InMemoryDomainEventDispatcher,
    },
  ],
  exports: [
    ID_GENERATOR,
    CLOCK,
    DOMAIN_EVENT_DISPATCHER,
    InMemoryDomainEventDispatcher,
  ],
})
export class CommonModule {}
