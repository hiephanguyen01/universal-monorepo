export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
}

export interface TokenService {
  generateAccessToken(payload: AccessTokenPayload): Promise<string>;

  generateRefreshToken(payload: RefreshTokenPayload): Promise<string>;

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;

  getRefreshTokenExpirationDate(): Date;
}
