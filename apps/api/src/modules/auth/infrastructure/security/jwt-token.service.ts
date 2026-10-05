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

  async generateAccessToken(
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
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        30,
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
}
