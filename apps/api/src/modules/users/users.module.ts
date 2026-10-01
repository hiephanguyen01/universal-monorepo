import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { USER_REPOSITORY } from './domain/user';
import { GetCurrentUserUseCase, UpdateCurrentUserUseCase } from './application/user.use-cases';
import { UsersController } from './presentation/users.controller';
@Module({ imports:[AuthModule],controllers:[UsersController],providers:[
  {provide:GetCurrentUserUseCase,inject:[USER_REPOSITORY],useFactory:(u:any)=>new GetCurrentUserUseCase(u)},
  {provide:UpdateCurrentUserUseCase,inject:[USER_REPOSITORY],useFactory:(u:any)=>new UpdateCurrentUserUseCase(u)}
]}) export class UsersModule {}
