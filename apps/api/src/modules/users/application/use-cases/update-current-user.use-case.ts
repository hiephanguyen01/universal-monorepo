import {
  ConflictError,
  NotFoundError,
} from "@/common/errors";

import type {
  Clock,
} from "@/common/ports/clock.port";

import type {
  UserRepository,
} from "../../domain/repositories/user.repository";

import {
  UserId,
} from "../../domain/value-objects/user-id.vo";

import type {
  UserOutput,
} from "../dto/user-output";

import {
  UserVersionConflictError,
} from "../errors/user-version-conflict.error";

import {
  UserOutputMapper,
} from "../mappers/user-output.mapper";

export interface UpdateCurrentUserInput {
  fullName: string;
  version: number;
}

export class UpdateCurrentUserUseCase {
  constructor(
    private readonly users:
      UserRepository,

    private readonly clock:
      Clock,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UserOutput> {
    const user =
      await this.users.findById(
        UserId.create(
          userId,
        ),
      );

    if (!user) {
      throw new NotFoundError(
        "User not found",
      );
    }

    if (
      user.version !==
      input.version
    ) {
      throw new ConflictError(
        "USER_CONCURRENT_MODIFICATION",
        "User was modified by another request",
      );
    }

    const changed =
      user.changeFullName(
        input.fullName,
        this.clock.now(),
      );

    let savedUser =
      user;

    try {
      if (changed) {
        savedUser =
          await this.users.save(
            user,
          );
      }
    } catch (error) {
      if (
        error instanceof
        UserVersionConflictError
      ) {
        throw new ConflictError(
          "USER_CONCURRENT_MODIFICATION",
          "User was modified by another request",
        );
      }

      throw error;
    }

    return UserOutputMapper
      .toOutput(
        savedUser,
      );
  }
}
