import { Injectable } from "@nestjs/common";

import type { Clock } from "@/common/ports/clock.port";

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
