import { describe, expect, it } from 'vitest';
import { RegisterUseCase } from '../src/modules/auth/application/auth.use-cases';
class Users { items:any[]=[]; findByEmail(e:string){return Promise.resolve(this.items.find(x=>x.email===e)??null)} findById(id:string){return Promise.resolve(this.items.find(x=>x.id===id)??null)} async create(x:any){const u={...x,id:'u1',role:'USER',status:'ACTIVE',createdAt:new Date(),updatedAt:new Date()};this.items.push(u);return u} updateProfile(){throw 0} }
class Hasher { hash(v:string){return Promise.resolve(`h:${v}`)} verify(h:string,v:string){return Promise.resolve(h===`h:${v}`)} }
class Tokens { signAccessToken(){return Promise.resolve('a')} signRefreshToken(){return Promise.resolve('r')} verifyAccessToken(){throw 0} verifyRefreshToken(){throw 0} refreshExpiresAt(){return new Date(Date.now()+10000)} }
class Sessions { create(){return Promise.resolve()} findById(){return Promise.resolve(null)} revoke(){return Promise.resolve()} }
describe('RegisterUseCase',()=>{it('creates a user and session',async()=>{const result=await new RegisterUseCase(new Users() as any,new Hasher(),new Tokens() as any,new Sessions()).execute({email:'A@EXAMPLE.COM',password:'password123',fullName:'Alice'});expect(result.user.email).toBe('a@example.com');expect(result.accessToken).toBe('a')})});
