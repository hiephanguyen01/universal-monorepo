import { PrismaService } from "@/infrastructure/prisma/prisma.service";

export function createTestPrisma(): PrismaService {
  return new PrismaService();
}

export async function clearDatabase(
  prisma: PrismaService,
): Promise<void> {
  await prisma.idempotencyRecord.deleteMany();
  await prisma.inboxEvent.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
