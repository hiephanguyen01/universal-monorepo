export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;

  findActiveByUserId(userId: string): Promise<RefreshTokenRecord[]>;

  revoke(id: string): Promise<void>;

  revokeAllByUserId(userId: string): Promise<void>;
}
