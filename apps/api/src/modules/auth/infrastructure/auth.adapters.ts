import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { env } from '../../../config/env';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AccessPayload, PasswordHasher, RefreshPayload, RefreshTokenRepository, TokenService } from '../domain/ports';
@Injectable()
export class ArgonPasswordHasher implements PasswordHasher { hash(v:string){return argon2.hash(v);} verify(h:string,v:string){return argon2.verify(h,v);} }
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt:JwtService){}
  signAccessToken(p:AccessPayload){ return this.jwt.signAsync(p,{secret:env.JWT_ACCESS_SECRET,expiresIn:env.JWT_ACCESS_EXPIRES_IN as any}); }
  signRefreshToken(p:RefreshPayload){ return this.jwt.signAsync(p,{secret:env.JWT_REFRESH_SECRET,expiresIn:env.JWT_REFRESH_EXPIRES_IN as any}); }
  verifyAccessToken(t:string){ return this.jwt.verifyAsync<AccessPayload>(t,{secret:env.JWT_ACCESS_SECRET}); }
  verifyRefreshToken(t:string){ return this.jwt.verifyAsync<RefreshPayload>(t,{secret:env.JWT_REFRESH_SECRET}); }
  refreshExpiresAt(){ const match=env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)d$/); const days=match?Number(match[1]):30; return new Date(Date.now()+days*86400000); }
}
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma:PrismaService){}
  async create(input:{id:string;userId:string;tokenHash:string;expiresAt:Date}){ await this.prisma.refreshToken.create({data:input}); }
  findById(id:string){ return this.prisma.refreshToken.findUnique({where:{id}}); }
  async revoke(id:string){ await this.prisma.refreshToken.update({where:{id},data:{revokedAt:new Date()}}); }
}
