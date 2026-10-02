import { Body, Controller, Post } from "@nestjs/common";

import { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";

import { LoginDto } from "@/modules/auth/presentation/dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
  }
}
