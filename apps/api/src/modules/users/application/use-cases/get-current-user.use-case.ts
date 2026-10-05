import { NotFoundError } from "@/common/errors";

import type { UserRepository } from "../../domain/repositories/user.repository";

import { UserId } from "../../domain/value-objects/user-id.vo";

import type { UserOutput } from "../dto/user-output";

import { UserOutputMapper } from "../mappers/user-output.mapper";

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserOutput> {
    const user = await this.users.findById(UserId.create(userId));

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return UserOutputMapper.toOutput(user);
  }
}
