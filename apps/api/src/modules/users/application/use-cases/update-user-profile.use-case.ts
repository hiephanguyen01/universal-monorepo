import { NotFoundError } from "@/common/errors";

import type { UserRole } from "../../domain/entities/user.entity";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { UserAccessPolicy } from "../policies/user-access.policy";

export interface UpdateUserActorInput {
  id: string;
  role: UserRole;
}

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
    actor: UpdateUserActorInput,
    targetUserId: string,
    input: UpdateUserProfileInput,
  ): Promise<UpdateUserProfileOutput> {
    const actorId = UserId.create(actor.id);
    const targetId = UserId.create(targetUserId);

    this.accessPolicy.assertCanUpdateProfile(
      {
        id: actorId,
        role: actor.role,
      },
      targetId,
    );

    const user = await this.users.findById(targetId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.changeFullName(input.fullName);

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
