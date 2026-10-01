import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { USER_REPOSITORY } from '../users/domain/user';
import { PrismaUserRepository } from '../users/infrastructure/prisma-user.repository';
import { LoginUseCase, LogoutUseCase, RefreshUseCase, RegisterUseCase } from './application/auth.use-cases';
import { PASSWORD_HASHER, REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE } from './domain/ports';
import { ArgonPasswordHasher, JwtTokenService, PrismaRefreshTokenRepository } from './infrastructure/auth.adapters';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';
@Module({
  imports:[JwtModule.register({})],controllers:[AuthController],
  providers:[PrismaService,{provide:USER_REPOSITORY,useClass:PrismaUserRepository},{provide:PASSWORD_HASHER,useClass:ArgonPasswordHasher},{provide:TOKEN_SERVICE,useClass:JwtTokenService},{provide:REFRESH_TOKEN_REPOSITORY,useClass:PrismaRefreshTokenRepository},
    {provide:RegisterUseCase,inject:[USER_REPOSITORY,PASSWORD_HASHER,TOKEN_SERVICE,REFRESH_TOKEN_REPOSITORY],useFactory:(u:any,h:any,t:any,s:any)=>new RegisterUseCase(u,h,t,s)},
    {provide:LoginUseCase,inject:[USER_REPOSITORY,PASSWORD_HASHER,TOKEN_SERVICE,REFRESH_TOKEN_REPOSITORY],useFactory:(u:any,h:any,t:any,s:any)=>new LoginUseCase(u,h,t,s)},
    {provide:RefreshUseCase,inject:[USER_REPOSITORY,PASSWORD_HASHER,TOKEN_SERVICE,REFRESH_TOKEN_REPOSITORY],useFactory:(u:any,h:any,t:any,s:any)=>new RefreshUseCase(u,h,t,s)},
    {provide:LogoutUseCase,inject:[PASSWORD_HASHER,TOKEN_SERVICE,REFRESH_TOKEN_REPOSITORY],useFactory:(h:any,t:any,s:any)=>new LogoutUseCase(h,t,s)},JwtAuthGuard],
  exports:[JwtAuthGuard,TOKEN_SERVICE,USER_REPOSITORY,PrismaService]
}) export class AuthModule {}
