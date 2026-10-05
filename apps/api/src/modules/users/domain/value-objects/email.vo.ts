import { InvalidEmailError } from "../errors/invalid-email.error";

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();

    if (!Email.isValid(normalized)) {
      throw new InvalidEmailError();
    }

    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  private static isValid(value: string): boolean {
    if (value.length === 0 || value.length > 254) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
