import { ConflictError } from "@/common/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";
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
  ) {}

  async execute(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictError(
        "EMAIL_ALREADY_EXISTS",
        "Email already exists",
      );
    }

    const user = await this.users.create({
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      fullName: input.fullName.trim(),
    });

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const generatedRefreshToken =
      await this.tokenService.generateRefreshToken(user.id);

    await this.refreshTokens.create({
      id: generatedRefreshToken.sessionId,
      userId: user.id,
      tokenHash: await this.passwordHasher.hash(generatedRefreshToken.token),
      expiresAt: generatedRefreshToken.expiresAt,
    });

    return {
      accessToken,
      refreshToken: generatedRefreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
