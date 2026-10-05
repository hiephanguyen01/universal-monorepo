import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "@/generated/prisma/client";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/app_test?schema=public";

export function createTestPrisma(): PrismaClient {
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    DEFAULT_TEST_DATABASE_URL;

  const adapter =
    new PrismaPg({
      connectionString:
        databaseUrl,
    });

  return new PrismaClient({
    adapter,
  });
}

export async function clearDatabase(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.refreshToken
    .deleteMany();

  await prisma.user
    .deleteMany();
}
