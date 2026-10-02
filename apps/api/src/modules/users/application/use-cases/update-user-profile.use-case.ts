import { NotFoundError } from "@/common/errors";

import {
  UserAccessPolicy,
  UserActor,
} from "@/modules/auth/application/policies/user-access.policy";
import type { UserRepository } from "../../domain/repositories/user.repository";

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

    const existingUser = await this.users.findById(targetUserId);

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    const user = await this.users.updateProfile(targetUserId, {
      fullName: input.fullName.trim(),
    });

    return {
      id: user.id,

      email: user.email,

      fullName: user.fullName,

      role: user.role,

      status: user.status,

      createdAt: user.createdAt.toISOString(),

      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
