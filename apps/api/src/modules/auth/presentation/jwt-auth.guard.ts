import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKEN_SERVICE, type TokenService } from '../domain/ports';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens:TokenService){}
  async canActivate(context:ExecutionContext){
    const req=context.switchToHttp().getRequest(); const header=req.headers.authorization as string|undefined;
    if(!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try { req.user=await this.tokens.verifyAccessToken(header.slice(7)); return true; } catch { throw new UnauthorizedException(); }
  }
}
