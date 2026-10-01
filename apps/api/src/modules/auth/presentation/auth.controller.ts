import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginUseCase, LogoutUseCase, RefreshUseCase, RegisterUseCase } from '../application/auth.use-cases';
class LoginDto { @IsEmail() email!:string; @IsString() @MinLength(8) password!:string; }
class RegisterDto extends LoginDto { @IsString() @MinLength(2) fullName!:string; }
class RefreshDto { @IsString() refreshToken!:string; }
const publicUser=(u:any)=>({id:u.id,email:u.email,fullName:u.fullName,role:u.role,status:u.status,createdAt:u.createdAt,updatedAt:u.updatedAt});
@Controller('auth')
export class AuthController {
  constructor(private register: RegisterUseCase, private login: LoginUseCase, private refresh: RefreshUseCase, private logout: LogoutUseCase){}
  @Post('register') async doRegister(@Body() dto:RegisterDto){ const r=await this.register.execute(dto); return {success:true,data:{user:publicUser(r.user),accessToken:r.accessToken,refreshToken:r.refreshToken}}; }
  @Post('login') async doLogin(@Body() dto:LoginDto){ const r=await this.login.execute(dto); return {success:true,data:{user:publicUser(r.user),accessToken:r.accessToken,refreshToken:r.refreshToken}}; }
  @Post('refresh') async doRefresh(@Body() dto:RefreshDto){ return {success:true,data:await this.refresh.execute(dto.refreshToken)}; }
  @Post('logout') async doLogout(@Body() dto:RefreshDto){ await this.logout.execute(dto.refreshToken); return {success:true,data:null}; }
}
