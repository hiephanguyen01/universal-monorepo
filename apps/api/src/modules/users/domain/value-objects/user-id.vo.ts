import { DomainError } from "@/common/domain/domain-error";

export class InvalidUserIdError extends DomainError {
  constructor() {
    super("INVALID_USER_ID", "User id is invalid");
  }
}

export class UserId {
  private constructor(private readonly _value: string) {}

  static create(value: string): UserId {
    const normalized = value.trim();

    if (!normalized) {
      throw new InvalidUserIdError();
    }

    return new UserId(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
