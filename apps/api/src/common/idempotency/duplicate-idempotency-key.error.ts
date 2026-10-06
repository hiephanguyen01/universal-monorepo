export class DuplicateIdempotencyKeyError extends Error {
  constructor() {
    super("Idempotency key already exists");
    this.name = "DuplicateIdempotencyKeyError";
  }
}
