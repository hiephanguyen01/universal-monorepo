import { ConflictError, NotFoundError } from "@/common/errors";
import type { Clock } from "@/common/ports/clock.port";

import type { UserRole } from "../../domain/entities/user.entity";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { UserOutput } from "../dto/user-output";
import { UserVersionConflictError } from "../errors/user-version-conflict.error";
import { UserOutputMapper } from "../mappers/user-output.mapper";
import { UserAccessPolicy } from "../policies/user-access.policy";

export interface UpdateUserActorInput {
  id: string;
  role: UserRole;
}

export interface UpdateUserProfileInput {
  fullName: string;
  version: number;
}

export class UpdateUserProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly accessPolicy: UserAccessPolicy,
    private readonly clock: Clock,
  ) {}

  async execute(
    actor: UpdateUserActorInput,
    targetUserId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserOutput> {
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

    if (user.version !== input.version) {
      throw new ConflictError(
        "USER_CONCURRENT_MODIFICATION",
        "User was modified by another request",
      );
    }

    const changed = user.changeFullName(input.fullName, this.clock.now());

    let savedUser = user;

    try {
      if (changed) {
        savedUser = await this.users.save(user);
      }
    } catch (error) {
      if (error instanceof UserVersionConflictError) {
        throw new ConflictError(
          "USER_CONCURRENT_MODIFICATION",
          "User was modified by another request",
        );
      }

      throw error;
    }

    return UserOutputMapper.toOutput(savedUser);
  }
}
