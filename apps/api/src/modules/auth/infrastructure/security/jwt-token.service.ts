import {
  randomUUID,
} from "node:crypto";

import {
  Injectable,
} from "@nestjs/common";

import {
  JwtService,
  type JwtSignOptions,
} from "@nestjs/jwt";

import {
  env,
} from "@/config/env";

import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from "../../application/ports/token-service.port";

@Injectable()
export class JwtTokenService
  implements TokenService
{
  constructor(
    private readonly jwtService:
      JwtService,
  ) {}

  generateAccessToken(
    payload: AccessTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(
      payload,
      {
        secret:
          env.JWT_ACCESS_SECRET,

        expiresIn:
          env.JWT_ACCESS_EXPIRES_IN as JwtSignOptions["expiresIn"],
      },
    );
  }

  async generateRefreshToken(
    userId: string,
  ): Promise<GeneratedRefreshToken> {
    const sessionId =
      randomUUID();

    const expiresAt =
      this.createExpiresAt(
        env.JWT_REFRESH_EXPIRES_IN,
      );

    const token =
      await this.jwtService
        .signAsync(
          {
            sub:
              userId,
            jti:
              sessionId,
          },
          {
            secret:
              env.JWT_REFRESH_SECRET,

            expiresIn:
              env.JWT_REFRESH_EXPIRES_IN as JwtSignOptions["expiresIn"],
          },
        );

    return {
      token,
      sessionId,
      expiresAt,
    };
  }

  verifyAccessToken(
    token: string,
  ): Promise<AccessTokenPayload> {
    return this.jwtService
      .verifyAsync<AccessTokenPayload>(
        token,
        {
          secret:
            env.JWT_ACCESS_SECRET,
        },
      );
  }

  verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    return this.jwtService
      .verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret:
            env.JWT_REFRESH_SECRET,
        },
      );
  }

  private createExpiresAt(
    duration: string,
  ): Date {
    const amount =
      Number(
        duration.slice(
          0,
          -1,
        ),
      );

    const unit =
      duration.slice(-1);

    const multipliers = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    } as const;

    const multiplier =
      multipliers[
        unit as keyof typeof multipliers
      ];

    if (
      !multiplier ||
      !Number.isFinite(
        amount,
      )
    ) {
      throw new Error(
        "Invalid JWT refresh duration",
      );
    }

    return new Date(
      Date.now() +
        amount *
          multiplier,
    );
  }
}
