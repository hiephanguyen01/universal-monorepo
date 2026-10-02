export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface GeneratedRefreshToken {
  token: string;
  sessionId: string;
  expiresAt: Date;
}

export interface TokenService {
  generateAccessToken(payload: AccessTokenPayload): Promise<string>;

  generateRefreshToken(userId: string): Promise<GeneratedRefreshToken>;

  verifyAccessToken(token: string): Promise<AccessTokenPayload>;

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
