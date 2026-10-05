import { DomainError } from "@/common/domain/domain-error";

export class InvalidEmailError extends DomainError {
  constructor() {
    super("INVALID_EMAIL", "Email is invalid");
  }
}
