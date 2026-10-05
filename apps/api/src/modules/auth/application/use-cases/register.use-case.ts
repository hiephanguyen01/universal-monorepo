import { ConflictError } from "@/common/errors";
import { IdGenerator } from "@/common/ports/id-generator.port";
import { User } from "@/modules/users/domain/entities/user.entity";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";
import { Email } from "@/modules/users/domain/value-objects/email.vo";
import { UserId } from "@/modules/users/domain/value-objects/user-id.vo";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { RefreshTokenRepository } from "../ports/refresh-token.repository";
import type { TokenService } from "../ports/token-service.port";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,

    private readonly passwordHasher: PasswordHasher,

    private readonly tokenService: TokenService,

    private readonly refreshTokens: RefreshTokenRepository,

    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RegisterInput) {
    const email = Email.create(input.email);

    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new ConflictError("EMAIL_ALREADY_EXISTS", "Email already exists");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: UserId.create(this.idGenerator.generate()),

      email,

      passwordHash,

      fullName: input.fullName,
    });

    const savedUser = await this.users.create(user);

    const accessToken = await this.tokenService.generateAccessToken({
      sub: savedUser.id.value,

      email: savedUser.email.value,

      role: savedUser.role,
    });

    const generatedRefreshToken = await this.tokenService.generateRefreshToken(
      savedUser.id.value,
    );

    const refreshTokenHash = await this.passwordHasher.hash(
      generatedRefreshToken.token,
    );

    await this.refreshTokens.create({
      id: generatedRefreshToken.sessionId,

      userId: savedUser.id.value,

      tokenHash: refreshTokenHash,

      expiresAt: generatedRefreshToken.expiresAt,
    });

    return {
      accessToken,

      refreshToken: generatedRefreshToken.token,

      user: {
        id: savedUser.id.value,

        email: savedUser.email.value,

        fullName: savedUser.fullName,

        role: savedUser.role,

        status: savedUser.status,

        createdAt: savedUser.createdAt.toISOString(),

        updatedAt: savedUser.updatedAt.toISOString(),
      },
    };
  }
}
