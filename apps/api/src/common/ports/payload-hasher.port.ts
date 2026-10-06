export interface PayloadHasher {
  hash(payload: unknown): string;
}
