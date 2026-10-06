import { createHash } from "node:crypto";

import { Injectable } from "@nestjs/common";

import type { PayloadHasher } from "@/common/ports/payload-hasher.port";

@Injectable()
export class Sha256PayloadHasher implements PayloadHasher {
  hash(payload: unknown): string {
    return createHash("sha256")
      .update(this.canonicalize(payload))
      .digest("hex");
  }

  private canonicalize(value: unknown): string {
    if (value === null) return "null";
    if (value instanceof Date) return JSON.stringify(value.toISOString());

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalize(item)).join(",")}]`;
    }

    if (typeof value === "object") {
      const entries = Object.entries(
        value as Record<string, unknown>,
      )
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right));

      return `{${entries
        .map(
          ([key, item]) =>
            `${JSON.stringify(key)}:${this.canonicalize(item)}`,
        )
        .join(",")}}`;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return JSON.stringify(value);
    }

    throw new Error(
      `Unsupported idempotency payload value: ${typeof value}`,
    );
  }
}
