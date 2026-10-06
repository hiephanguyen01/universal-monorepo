import type { User } from "../../domain/entities/user.entity";
import type { UserOutput } from "../dto/user-output";

export interface CurrentUserUpdateTransactionInput {
  user: User;
  changed: boolean;
  idempotency: {
    scope: string;
    key: string;
    requestHash: string;
  };
}

export interface CurrentUserUpdateUnitOfWork {
  execute(
    input: CurrentUserUpdateTransactionInput,
  ): Promise<UserOutput>;
}
