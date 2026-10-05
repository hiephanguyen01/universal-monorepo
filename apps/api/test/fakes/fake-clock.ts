import type {
  Clock,
} from "@/common/ports/clock.port";

export class FakeClock
  implements Clock
{
  constructor(
    private readonly current:
      Date,
  ) {}

  now(): Date {
    return this.current;
  }
}
