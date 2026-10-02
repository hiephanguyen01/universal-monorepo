// apps/api/src/modules/auth/presentation/guards/jwt-auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { TOKEN_SERVICE } from "../../auth.tokens";

import type { TokenService } from "../../application/ports/token-service.port";

import type { AuthenticatedUser } from "../types/authenticated-user";

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };

  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
