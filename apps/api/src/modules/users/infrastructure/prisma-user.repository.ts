import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { UserRepository } from '../domain/user';
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  findById(id: string) { return this.prisma.user.findUnique({ where: { id } }) as any; }
  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email } }) as any; }
  create(input: { email:string; passwordHash:string; fullName:string; role?:'USER'|'ADMIN' }) { return this.prisma.user.create({ data: { ...input, role: input.role ?? 'USER' } }) as any; }
  updateProfile(id: string, input: { fullName:string }) { return this.prisma.user.update({ where:{ id }, data:input }) as any; }
}
