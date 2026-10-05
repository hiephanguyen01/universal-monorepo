import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  PrismaRefreshTokenRepository,
} from "@/modules/auth/infrastructure/persistence/prisma-refresh-token.repository";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe(
  "PrismaRefreshTokenRepository integration",
  () => {
    const prisma =
      createTestPrisma();

    const repository =
      new PrismaRefreshTokenRepository(
        prisma,
      );

    beforeAll(
      async () => {
        await prisma.$connect();
      },
    );

    beforeEach(
      async () => {
        await clearDatabase(
          prisma,
        );

        await prisma.user.create({
          data: {
            id:
              "user-1",
            email:
              "alice@example.com",
            passwordHash:
              "hash",
            fullName:
              "Alice",
            role:
              "USER",
            status:
              "ACTIVE",
            version:
              0,
            createdAt:
              new Date(
                "2026-10-05T10:00:00.000Z",
              ),
            updatedAt:
              new Date(
                "2026-10-05T10:00:00.000Z",
              ),
          },
        });

        await prisma.refreshToken.create({
          data: {
            id:
              "session-1",
            userId:
              "user-1",
            tokenHash:
              "hash-1",
            expiresAt:
              new Date(
                "2026-10-06T10:00:00.000Z",
              ),
          },
        });
      },
    );

    afterAll(
      async () => {
        await prisma.$disconnect();
      },
    );

    it(
      "rotates a refresh token atomically",
      async () => {
        const rotated =
          await repository.rotate({
            currentSessionId:
              "session-1",
            nextSession: {
              id:
                "session-2",
              userId:
                "user-1",
              tokenHash:
                "hash-2",
              expiresAt:
                new Date(
                  "2026-10-07T10:00:00.000Z",
                ),
            },
          });

        expect(rotated).toBe(true);

        const oldSession =
          await prisma.refreshToken
            .findUnique({
              where: {
                id:
                  "session-1",
              },
            });

        const newSession =
          await prisma.refreshToken
            .findUnique({
              where: {
                id:
                  "session-2",
              },
            });

        expect(
          oldSession?.revokedAt,
        ).toBeInstanceOf(Date);

        expect(
          newSession,
        ).not.toBeNull();
      },
    );

    it(
      "rejects replay of an already rotated refresh token",
      async () => {
        await repository.rotate({
          currentSessionId:
            "session-1",
          nextSession: {
            id:
              "session-2",
            userId:
              "user-1",
            tokenHash:
              "hash-2",
            expiresAt:
              new Date(
                "2026-10-07T10:00:00.000Z",
              ),
          },
        });

        const replay =
          await repository.rotate({
            currentSessionId:
              "session-1",
            nextSession: {
              id:
                "session-3",
            userId:
              "user-1",
            tokenHash:
              "hash-3",
            expiresAt:
              new Date(
                "2026-10-08T10:00:00.000Z",
              ),
          },
        });

        expect(replay).toBe(false);

        expect(
          await prisma.refreshToken
            .findUnique({
              where: {
                id:
                  "session-3",
              },
            }),
        ).toBeNull();
      },
    );
  },
);
