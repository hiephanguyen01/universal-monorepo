import { ConflictError, NotFoundError } from "@/common/errors";
import type { Clock } from "@/common/ports/clock.port";

import { UserVersionConflictError } from "../errors/user-version-conflict.error";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UpdateCurrentUserInput {
  fullName: string;
  version: number;
}

export interface UpdateCurrentUserOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export class UpdateCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UpdateCurrentUserOutput> {
    const user = await this.users.findById(UserId.create(userId));

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.version !== input.version) {
      throw new ConflictError(
        "USER_CONCURRENT_MODIFICATION",
        "User was modified by another request",
      );
    }

    user.changeFullName(input.fullName, this.clock.now());

    let savedUser;

    try {
      savedUser = await this.users.save(user);
    } catch (error) {
      if (error instanceof UserVersionConflictError) {
        throw new ConflictError(
          "USER_CONCURRENT_MODIFICATION",
          "User was modified by another request",
        );
      }

      throw error;
    }

    return {
      id: savedUser.id.value,
      email: savedUser.email.value,
      fullName: savedUser.fullName,
      role: savedUser.role,
      status: savedUser.status,
      version: savedUser.version,
      createdAt: savedUser.createdAt.toISOString(),
      updatedAt: savedUser.updatedAt.toISOString(),
    };
  }
}
