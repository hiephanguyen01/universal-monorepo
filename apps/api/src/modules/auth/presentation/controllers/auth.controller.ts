import { Body, Controller, Post } from "@nestjs/common";

import { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";
import { RefreshTokenUseCase } from "@/modules/auth/application/use-cases/refresh-token.use-case";
import { LogoutUseCase } from "@/modules/auth/application/use-cases/logout.use-case";

import { LoginDto } from "@/modules/auth/presentation/dto/login.dto";
import { RefreshTokenDto } from "@/modules/auth/presentation/dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
    });
  }

  @Post("logout")
  async logout(@Body() dto: RefreshTokenDto) {
    await this.logoutUseCase.execute({
      refreshToken: dto.refreshToken,
    });
    return { success: true };
  }
}
