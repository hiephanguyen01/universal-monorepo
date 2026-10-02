export interface RefreshTokenRecord {
  id: string;

  userId: string;

  tokenHash: string;

  expiresAt: Date;

  revokedAt: Date | null;

  createdAt: Date;
}

export interface CreateRefreshTokenInput {
  id: string;

  userId: string;

  tokenHash: string;

  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;

  findById(id: string): Promise<RefreshTokenRecord | null>;

  revoke(id: string): Promise<void>;

  revokeAllByUserId(userId: string): Promise<void>;
}
