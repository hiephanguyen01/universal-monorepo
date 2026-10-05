import type {
  RefreshTokenPayload,
  TokenService,
} from "../ports/token-service.port";

import type {
  RefreshTokenRepository,
} from "../ports/refresh-token.repository";

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly tokenService:
      TokenService,

    private readonly refreshTokens:
      RefreshTokenRepository,
  ) {}

  async execute(
    input: LogoutInput,
  ): Promise<void> {
    let payload:
      RefreshTokenPayload;

    try {
      payload =
        await this.tokenService
          .verifyRefreshToken(
            input.refreshToken,
          );
    } catch {
      return;
    }

    const session =
      await this.refreshTokens
        .findById(
          payload.jti,
        );

    if (
      !session ||
      session.revokedAt ||
      session.userId !==
        payload.sub
    ) {
      return;
    }

    await this.refreshTokens
      .revoke(
        session.id,
      );
  }
}
