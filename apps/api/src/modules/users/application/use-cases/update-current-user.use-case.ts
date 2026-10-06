import { DuplicateIdempotencyKeyError } from "@/common/idempotency/duplicate-idempotency-key.error";
import {
  ConflictError,
  NotFoundError,
} from "@/common/errors";
import type { Clock } from "@/common/ports/clock.port";
import type { IdempotencyRepository } from "@/common/ports/idempotency-repository.port";
import type { PayloadHasher } from "@/common/ports/payload-hasher.port";

import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import type { UserOutput } from "../dto/user-output";
import { UserVersionConflictError } from "../errors/user-version-conflict.error";
import { UserOutputMapper } from "../mappers/user-output.mapper";
import type { CurrentUserUpdateUnitOfWork } from "../ports/current-user-update-unit-of-work.port";

export interface UpdateCurrentUserInput {
  fullName: string;
  version: number;
}

export class UpdateCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
    private readonly idempotency?: IdempotencyRepository,
    private readonly payloadHasher?: PayloadHasher,
    private readonly unitOfWork?: CurrentUserUpdateUnitOfWork,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserInput,
    idempotencyKey?: string,
  ): Promise<UserOutput> {
    const key =
      idempotencyKey?.trim();

    if (
      key &&
      this.idempotency &&
      this.payloadHasher &&
      this.unitOfWork
    ) {
      return this.executeIdempotently(
        userId,
        input,
        key,
      );
    }

    return this.executeLegacy(
      userId,
      input,
    );
  }

  private async executeIdempotently(
    userId: string,
    input: UpdateCurrentUserInput,
    idempotencyKey: string,
  ): Promise<UserOutput> {
    const idempotency =
      this.idempotency!;
    const payloadHasher =
      this.payloadHasher!;
    const unitOfWork =
      this.unitOfWork!;

    const scope =
      `users.update-current:${userId}`;
    const requestHash =
      payloadHasher.hash({
        fullName:
          input.fullName.trim(),
        version:
          input.version,
      });

    const existing =
      await idempotency.find(
        scope,
        idempotencyKey,
      );

    if (existing) {
      return this.replay(
        existing.requestHash,
        existing.response,
        requestHash,
      );
    }

    const {
      user,
      changed,
    } =
      await this.prepareUpdate(
        userId,
        input,
      );

    try {
      return await unitOfWork.execute({
        user,
        changed,
        idempotency: {
          scope,
          key:
            idempotencyKey,
          requestHash,
        },
      });
    } catch (error) {
      if (
        error instanceof
        DuplicateIdempotencyKeyError
      ) {
        const winner =
          await idempotency.find(
            scope,
            idempotencyKey,
          );

        if (winner) {
          return this.replay(
            winner.requestHash,
            winner.response,
            requestHash,
          );
        }
      }

      this.rethrowRepositoryConflict(
        error,
      );
      throw error;
    }
  }

  private async executeLegacy(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UserOutput> {
    const {
      user,
      changed,
    } =
      await this.prepareUpdate(
        userId,
        input,
      );

    try {
      const savedUser =
        changed
          ? await this.users.save(
              user,
            )
          : user;

      return UserOutputMapper
        .toOutput(
          savedUser,
        );
    } catch (error) {
      this.rethrowRepositoryConflict(
        error,
      );
      throw error;
    }
  }

  private async prepareUpdate(
    userId: string,
    input: UpdateCurrentUserInput,
  ) {
    const user =
      await this.users.findById(
        UserId.create(userId),
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

    return {
      user,
      changed,
    };
  }

  private replay(
    storedHash: string,
    response: unknown,
    requestHash: string,
  ): UserOutput {
    if (
      storedHash !==
      requestHash
    ) {
      throw new ConflictError(
        "IDEMPOTENCY_KEY_REUSED",
        "Idempotency key was already used with a different request",
      );
    }

    if (
      !response ||
      typeof response !==
        "object"
    ) {
      throw new Error(
        "Stored idempotency response is missing",
      );
    }

    return response as UserOutput;
  }

  private rethrowRepositoryConflict(
    error: unknown,
  ): void {
    if (
      error instanceof
      UserVersionConflictError
    ) {
      throw new ConflictError(
        "USER_CONCURRENT_MODIFICATION",
        "User was modified by another request",
      );
    }
  }
}
