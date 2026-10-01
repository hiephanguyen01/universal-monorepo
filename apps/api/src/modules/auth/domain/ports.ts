import type { UserRole } from '../../users/domain/user';
export interface PasswordHasher { hash(value:string):Promise<string>; verify(hash:string,value:string):Promise<boolean>; }
export interface AccessPayload { sub:string; role:UserRole }
export interface RefreshPayload extends AccessPayload { jti:string }
export interface TokenService {
  signAccessToken(payload: AccessPayload): Promise<string>;
  signRefreshToken(payload: RefreshPayload): Promise<string>;
  verifyAccessToken(token:string): Promise<AccessPayload>;
  verifyRefreshToken(token:string): Promise<RefreshPayload>;
  refreshExpiresAt(): Date;
}
export interface RefreshTokenRepository {
  create(input:{ id:string; userId:string; tokenHash:string; expiresAt:Date }):Promise<void>;
  findById(id:string):Promise<{id:string;userId:string;tokenHash:string;expiresAt:Date;revokedAt:Date|null}|null>;
  revoke(id:string):Promise<void>;
}
export const PASSWORD_HASHER=Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE=Symbol('TOKEN_SERVICE');
export const REFRESH_TOKEN_REPOSITORY=Symbol('REFRESH_TOKEN_REPOSITORY');
