import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { GetCurrentUserUseCase, UpdateCurrentUserUseCase } from '../application/user.use-cases';
class UpdateMeDto { @IsString() @MinLength(2) fullName!:string; }
const present=(u:any)=>({id:u.id,email:u.email,fullName:u.fullName,role:u.role,status:u.status,createdAt:u.createdAt,updatedAt:u.updatedAt});
@Controller('users') @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private getMe:GetCurrentUserUseCase,private updateMe:UpdateCurrentUserUseCase){}
  @Get('me') async me(@Req() req:any){ return {success:true,data:present(await this.getMe.execute(req.user.sub))}; }
  @Patch('me') async patchMe(@Req() req:any,@Body() dto:UpdateMeDto){ return {success:true,data:present(await this.updateMe.execute(req.user.sub,dto.fullName))}; }
}
