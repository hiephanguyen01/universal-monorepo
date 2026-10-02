import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from "../../application/ports/token-service.port";

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,

      expiresIn: "15m",
    });
  }

  async generateRefreshToken(userId: string): Promise<GeneratedRefreshToken> {
    const sessionId = randomUUID();

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);

    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        jti: sessionId,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,

        expiresIn: "30d",
      },
    );

    return {
      token,
      sessionId,
      expiresAt,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
}
