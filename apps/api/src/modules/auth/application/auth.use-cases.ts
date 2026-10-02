import { randomUUID } from "node:crypto";
import { ConflictError, UnauthorizedError } from "@/common/errors";
import type { UserRepository } from "@/modules/users/domain/user";
import type {
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
} from "@/modules/auth/domain/ports";

async function issue(
  user: { id: string; role: "USER" | "ADMIN" },
  hasher: PasswordHasher,
  tokens: TokenService,
  sessions: RefreshTokenRepository,
) {
  const tokenId = randomUUID();
  const accessToken = await tokens.signAccessToken({
    sub: user.id,
    role: user.role,
  });
  const refreshToken = await tokens.signRefreshToken({
    sub: user.id,
    role: user.role,
    jti: tokenId,
  });
  await sessions.create({
    id: tokenId,
    userId: user.id,
    tokenHash: await hasher.hash(refreshToken),
    expiresAt: tokens.refreshExpiresAt(),
  });
  return { accessToken, refreshToken };
}

export class RegisterUseCase {
  constructor(
    private users: UserRepository,
    private hasher: PasswordHasher,
    private tokens: TokenService,
    private sessions: RefreshTokenRepository,
  ) {}
  async execute(input: { email: string; password: string; fullName: string }) {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email))
      throw new ConflictError("EMAIL_ALREADY_EXISTS", "Email already exists");
    const user = await this.users.create({
      email,
      passwordHash: await this.hasher.hash(input.password),
      fullName: input.fullName.trim(),
    });
    return {
      user,
      ...(await issue(user, this.hasher, this.tokens, this.sessions)),
    };
  }
}
export class LoginUseCase {
  constructor(
    private users: UserRepository,
    private hasher: PasswordHasher,
    private tokens: TokenService,
    private sessions: RefreshTokenRepository,
  ) {}
  async execute(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (
      !user ||
      !(await this.hasher.verify(user.passwordHash, input.password)) ||
      user.status !== "ACTIVE"
    )
      throw new UnauthorizedError("Invalid email or password");
    return {
      user,
      ...(await issue(user, this.hasher, this.tokens, this.sessions)),
    };
  }
}
export class RefreshUseCase {
  constructor(
    private users: UserRepository,
    private hasher: PasswordHasher,
    private tokens: TokenService,
    private sessions: RefreshTokenRepository,
  ) {}
  async execute(refreshToken: string) {
    const payload = await this.tokens
      .verifyRefreshToken(refreshToken)
      .catch(() => {
        throw new UnauthorizedError("Invalid refresh token");
      });
    const record = await this.sessions.findById(payload.jti);
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt <= new Date() ||
      !(await this.hasher.verify(record.tokenHash, refreshToken))
    )
      throw new UnauthorizedError("Refresh token is invalid or revoked");
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError();
    await this.sessions.revoke(record.id);
    return issue(user, this.hasher, this.tokens, this.sessions);
  }
}
export class LogoutUseCase {
  constructor(
    private hasher: PasswordHasher,
    private tokens: TokenService,
    private sessions: RefreshTokenRepository,
  ) {}
  async execute(refreshToken: string) {
    const payload = await this.tokens
      .verifyRefreshToken(refreshToken)
      .catch(() => null);
    if (!payload) return;
    const record = await this.sessions.findById(payload.jti);
    if (
      record &&
      !record.revokedAt &&
      (await this.hasher.verify(record.tokenHash, refreshToken))
    )
      await this.sessions.revoke(record.id);
  }
}
