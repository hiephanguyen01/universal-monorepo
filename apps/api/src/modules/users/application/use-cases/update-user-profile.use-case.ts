import { NotFoundError } from "@/common/errors";

import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserAccessPolicy, UserActor } from "../policies/user-access.policy";

export interface UpdateUserProfileInput {
  fullName: string;
}

export interface UpdateUserProfileOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class UpdateUserProfileUseCase {
  constructor(
    private readonly users: UserRepository,

    private readonly accessPolicy: UserAccessPolicy,
  ) {}

  async execute(
    actor: UserActor,
    targetUserId: string,
    input: UpdateUserProfileInput,
  ): Promise<UpdateUserProfileOutput> {
    this.accessPolicy.assertCanUpdateProfile(actor, targetUserId);

    const user = await this.users.findById(targetUserId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.changeFullName(input.fullName);

    const savedUser = await this.users.save(user);

    return {
      id: savedUser.id,

      email: savedUser.email.value,

      fullName: savedUser.fullName,

      role: savedUser.role,

      status: savedUser.status,

      createdAt: savedUser.createdAt.toISOString(),

      updatedAt: savedUser.updatedAt.toISOString(),
    };
  }
}
