import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from "@/modules/auth/application/ports/token-service.port";

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "15m",
    });
  }

  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "30d",
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }

  getRefreshTokenExpirationDate(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);

    return expiresAt;
  }
}
