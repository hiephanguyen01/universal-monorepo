import type { RefreshTokenRepository } from "../ports/refresh-token.repository";
import type { TokenService } from "../ports/token-service.port";

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(
        input.refreshToken,
      );
      await this.refreshTokens.revoke(payload.jti);
    } catch {
      // Invalidate silently if token is invalid or already expired
    }
  }
}
