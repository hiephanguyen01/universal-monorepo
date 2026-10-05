import { Module } from "@nestjs/common";

import { UuidIdGenerator } from "./infrastructure/id/uuid-id-generator";
import { SystemClock } from "./infrastructure/time/system-clock";
import { CLOCK, ID_GENERATOR } from "./common.tokens";

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
  ],
  exports: [ID_GENERATOR, CLOCK],
})
export class CommonModule {}
