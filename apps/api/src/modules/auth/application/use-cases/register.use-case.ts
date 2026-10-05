import { ConflictError } from "@/common/errors";

import type {
  Clock,
} from "@/common/ports/clock.port";

import type {
  IdGenerator,
} from "@/common/ports/id-generator.port";

import type {
  UserOutput,
} from "@/modules/users/application/dto/user-output";

import {
  DuplicateUserEmailError,
} from "@/modules/users/application/errors/duplicate-user-email.error";

import {
  UserOutputMapper,
} from "@/modules/users/application/mappers/user-output.mapper";

import {
  User,
} from "@/modules/users/domain/entities/user.entity";

import {
  UserRegisteredEvent,
} from "@/modules/users/domain/events/user-registered.event";

import type {
  UserRepository,
} from "@/modules/users/domain/repositories/user.repository";

import {
  Email,
} from "@/modules/users/domain/value-objects/email.vo";

import {
  UserId,
} from "@/modules/users/domain/value-objects/user-id.vo";

import type {
  PasswordHasher,
} from "../ports/password-hasher.port";

import type {
  RegistrationUnitOfWork,
} from "../ports/registration-unit-of-work.port";

import type {
  TokenService,
} from "../ports/token-service.port";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterOutput {
  accessToken: string;
  refreshToken: string;
  user: UserOutput;
}

export class RegisterUseCase {
  constructor(
    private readonly users:
      UserRepository,

    private readonly passwordHasher:
      PasswordHasher,

    private readonly tokenService:
      TokenService,

    private readonly registrationUnitOfWork:
      RegistrationUnitOfWork,

    private readonly idGenerator:
      IdGenerator,

    private readonly clock:
      Clock,

    private readonly events:
      DomainEventDispatcher,
  ) {}

  async execute(
    input: RegisterInput,
  ): Promise<RegisterOutput> {
    const email =
      Email.create(
        input.email,
      );

    const existingUser =
      await this.users
        .findByEmail(
          email,
        );

    if (existingUser) {
      throw new ConflictError(
        "EMAIL_ALREADY_EXISTS",
        "Email already exists",
      );
    }

    const passwordHash =
      await this.passwordHasher
        .hash(
          input.password,
        );

    const now =
      this.clock.now();

    const user =
      User.create({
        id:
          UserId.create(
            this.idGenerator
              .generate(),
          ),

        email,

        passwordHash,

        fullName:
          input.fullName,

        now,
      });

    const registeredEvent =
      new UserRegisteredEvent({
        userId:
          user.id.value,

        email:
          user.email.value,

        occurredAt:
          now,
      });

    const accessToken =
      await this.tokenService
        .generateAccessToken({
          sub:
            user.id.value,

          email:
            user.email.value,

          role:
            user.role,
        });

    const generatedRefreshToken =
      await this.tokenService
        .generateRefreshToken(
          user.id.value,
        );

    const refreshTokenHash =
      await this.passwordHasher
        .hash(
          generatedRefreshToken
            .token,
        );

    let savedUser:
      User;

    try {
      savedUser =
        await this.registrationUnitOfWork
          .execute({
            user,

            refreshToken: {
              id:
                generatedRefreshToken
                  .sessionId,

              userId:
                user.id.value,

              tokenHash:
                refreshTokenHash,

              expiresAt:
                generatedRefreshToken
                  .expiresAt,
            },

            events: [
              registeredEvent,
            ],
          });
    } catch (error) {
      if (
        error instanceof
        DuplicateUserEmailError
      ) {
        throw new ConflictError(
          "EMAIL_ALREADY_EXISTS",
          "Email already exists",
        );
      }

      throw error;
    }

    return {
      accessToken,

      refreshToken:
        generatedRefreshToken
          .token,

      user:
        UserOutputMapper
          .toOutput(
            savedUser,
          ),
    };
  }
}
