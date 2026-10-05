import { IdGenerator } from "@/common/ports/id-generator.port";
import { randomUUID } from "node:crypto";

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
