import { DomainError } from "@/common/domain/domain-error";

export class InvalidUserFullNameError extends DomainError {
  constructor() {
    super(
      "INVALID_USER_FULL_NAME",

      "Full name must be between 2 and 100 characters",
    );
  }
}
