import { UnauthorizedError } from "@/common/errors";
import type { PasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import type { RefreshTokenRepository } from "@/modules/auth/application/ports/refresh-token.repository";
import type { TokenService } from "@/modules/auth/application/ports/token-service.port";
import type { UserRepository } from "@/modules/users/domain/repositories/user.repository";

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
    const user = await this.users.findByEmail(input.email);

    if (!user) {
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

    const generatedRefreshToken = await this.tokenService.generateRefreshToken(
      user.id,
    );

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
      },
    };
  }
}
