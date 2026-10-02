import { UnauthorizedError } from "@/common/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { RefreshTokenRepository } from "../ports/refresh-token.repository";
import type { TokenService } from "../ports/token-service.port";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatched = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const generatedRefreshToken =
      await this.tokenService.generateRefreshToken(user.id);

    const refreshTokenHash = await this.passwordHasher.hash(
      generatedRefreshToken.token,
    );

    await this.refreshTokens.create({
      id: generatedRefreshToken.sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
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
