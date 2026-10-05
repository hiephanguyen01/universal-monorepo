import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";

import {
  LoginUseCase,
} from "@/modules/auth/application/use-cases/login.use-case";

import {
  LogoutUseCase,
} from "@/modules/auth/application/use-cases/logout.use-case";

import {
  RefreshTokenUseCase,
} from "@/modules/auth/application/use-cases/refresh-token.use-case";

import {
  RegisterUseCase,
} from "@/modules/auth/application/use-cases/register.use-case";

import {
  LoginDto,
} from "@/modules/auth/presentation/dto/login.dto";

import {
  RefreshTokenDto,
} from "@/modules/auth/presentation/dto/refresh-token.dto";

import {
  RegisterDto,
} from "@/modules/auth/presentation/dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase:
      RegisterUseCase,

    private readonly loginUseCase:
      LoginUseCase,

    private readonly refreshTokenUseCase:
      RefreshTokenUseCase,

    private readonly logoutUseCase:
      LogoutUseCase,
  ) {}

  @Post("register")
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.registerUseCase
      .execute({
        email:
          dto.email,

        password:
          dto.password,

        fullName:
          dto.fullName,
      });
  }

  @Post("login")
  @HttpCode(
    HttpStatus.OK,
  )
  login(
    @Body()
    dto: LoginDto,
  ) {
    return this.loginUseCase
      .execute({
        email:
          dto.email,

        password:
          dto.password,
      });
  }

  @Post("refresh")
  @HttpCode(
    HttpStatus.OK,
  )
  refresh(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.refreshTokenUseCase
      .execute({
        refreshToken:
          dto.refreshToken,
      });
  }

  @Post("logout")
  @HttpCode(
    HttpStatus.OK,
  )
  async logout(
    @Body()
    dto: RefreshTokenDto,
  ) {
    await this.logoutUseCase
      .execute({
        refreshToken:
          dto.refreshToken,
      });

    return null;
  }
}
