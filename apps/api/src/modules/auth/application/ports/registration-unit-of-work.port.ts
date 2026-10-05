import type { User } from "@/modules/users/domain/entities/user.entity";

import type { CreateRefreshTokenInput } from "./refresh-token.repository";

export interface RegisterTransactionInput {
  user: User;

  refreshToken: CreateRefreshTokenInput;
}

export interface RegistrationUnitOfWork {
  execute(input: RegisterTransactionInput): Promise<User>;
}
