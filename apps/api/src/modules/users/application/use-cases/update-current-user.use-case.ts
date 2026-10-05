import { NotFoundError } from "@/common/errors";
import type { Clock } from "@/common/ports/clock.port";

import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UpdateCurrentUserInput {
  fullName: string;
}

export interface UpdateCurrentUserOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
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

    user.changeFullName(input.fullName, this.clock.now());

    const savedUser = await this.users.save(user);

    return {
      id: savedUser.id.value,
      email: savedUser.email.value,
      fullName: savedUser.fullName,
      role: savedUser.role,
      status: savedUser.status,
      createdAt: savedUser.createdAt.toISOString(),
      updatedAt: savedUser.updatedAt.toISOString(),
    };
  }
}
