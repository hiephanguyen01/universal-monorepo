import { NotFoundError } from "@/common/errors";
import type { Clock } from "@/common/ports/clock.port";

import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import type { UserOutput } from "../dto/user-output";

import { UserOutputMapper } from "../mappers/user-output.mapper";

export interface UpdateCurrentUserInput {
  fullName: string;
}

export class UpdateCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UserOutput> {
    const user = await this.users.findById(UserId.create(userId));

    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.changeFullName(input.fullName, this.clock.now());

    const savedUser = await this.users.save(user);
    
    return UserOutputMapper.toOutput(savedUser);
  }
}
