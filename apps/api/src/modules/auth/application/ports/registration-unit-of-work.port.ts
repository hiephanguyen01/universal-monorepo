import type {
  DomainEvent,
} from "@/common/domain/domain-event";

import type {
  User,
} from "@/modules/users/domain/entities/user.entity";

import type {
  CreateRefreshTokenInput,
} from "./refresh-token.repository";

export interface RegisterTransactionInput {
  user: User;

  refreshToken:
    CreateRefreshTokenInput;

  events:
    DomainEvent[];
}

export interface RegistrationUnitOfWork {
  execute(
    input:
      RegisterTransactionInput,
  ): Promise<User>;
}
