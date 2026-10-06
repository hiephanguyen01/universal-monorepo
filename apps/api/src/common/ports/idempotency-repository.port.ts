export interface IdempotencyRecord {
  scope: string;
  key: string;
  requestHash: string;
  response: unknown;
}

export interface IdempotencyRepository {
  find(
    scope: string,
    key: string,
  ): Promise<IdempotencyRecord | null>;
}
