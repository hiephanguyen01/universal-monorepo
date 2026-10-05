import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  PrismaRegistrationUnitOfWork,
} from "@/modules/auth/infrastructure/persistence/prisma-registration-unit-of-work";

import {
  DuplicateUserEmailError,
} from "@/modules/users/application/errors/duplicate-user-email.error";

import {
  UserRegisteredEvent,
} from "@/modules/users/domain/events/user-registered.event";

import {
  makePrismaUserData,
} from "../factories/prisma-user.factory";

import {
  makeNewUser,
} from "../factories/user.factory";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe(
  "PrismaRegistrationUnitOfWork integration",
  () => {
    const prisma =
      createTestPrisma();

    const unitOfWork =
      new PrismaRegistrationUnitOfWork(
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
      },
    );

    afterAll(
      async () => {
        await prisma.$disconnect();
      },
    );

    it(
      "persists user and refresh token atomically",
      async () => {
        await unitOfWork.execute({
          user:
            makeNewUser({
              id:
                "user-1",
              email:
                "alice@example.com",
              passwordHash:
                "hash",
              now:
                new Date(
                  "2026-10-05T10:00:00.000Z",
                ),
            }),
          refreshToken: {
            id:
              "session-1",
            userId:
              "user-1",
            tokenHash:
              "token-hash",
            expiresAt:
              new Date(
                "2026-10-06T10:00:00.000Z",
              ),
          },

          events: [
            new UserRegisteredEvent({
              userId:
                "user-1",

              email:
                "alice@example.com",

              occurredAt:
                new Date(
                  "2026-10-05T10:00:00.000Z",
                ),
            }),
          ],
        });

        expect(
          await prisma.user.count(),
        ).toBe(1);

        expect(
          await prisma.refreshToken.count(),
        ).toBe(1);

        expect(
          await prisma.outboxEvent.count(),
        ).toBe(1);
      },
    );

    it(
      "rolls back user insert when refresh token insert fails",
      async () => {
        await prisma.user.create({
          data:
            makePrismaUserData({
              id:
                "existing-user",
              email:
                "existing@example.com",
              passwordHash:
                "hash",
              fullName:
                "Existing",
              createdAt:
                new Date(
                  "2026-10-05T09:00:00.000Z",
                ),
              updatedAt:
                new Date(
                  "2026-10-05T09:00:00.000Z",
                ),
            }),
        });

        await prisma.refreshToken.create({
          data: {
            id:
              "session-1",
            userId:
              "existing-user",
            tokenHash:
              "existing-hash",
            expiresAt:
              new Date(
                "2026-10-06T09:00:00.000Z",
              ),
          },
        });

        await expect(
          unitOfWork.execute({
            user:
              makeNewUser({
                id:
                  "new-user",
                email:
                  "new@example.com",
                passwordHash:
                  "hash",
                now:
                  new Date(
                    "2026-10-05T10:00:00.000Z",
                  ),
              }),
            refreshToken: {
              id:
                "session-1",
              userId:
                "new-user",
              tokenHash:
                "new-hash",
              expiresAt:
                new Date(
                  "2026-10-06T10:00:00.000Z",
                ),
            },

            events: [
              new UserRegisteredEvent({
                userId:
                  "new-user",

                email:
                  "new@example.com",

                occurredAt:
                  new Date(
                    "2026-10-05T10:00:00.000Z",
                  ),
              }),
            ],
          }),
        ).rejects.toThrow();

        expect(
          await prisma.user.findUnique({
            where: {
              id:
                "new-user",
            },
          }),
        ).toBeNull();

        expect(
          await prisma.outboxEvent.count(),
        ).toBe(0);
      },
    );

    it(
      "maps duplicate email to DuplicateUserEmailError",
      async () => {
        await prisma.user.create({
          data:
            makePrismaUserData({
              id:
                "existing-user",
              email:
                "alice@example.com",
              passwordHash:
                "hash",
              fullName:
                "Existing",
              createdAt:
                new Date(
                  "2026-10-05T09:00:00.000Z",
                ),
              updatedAt:
                new Date(
                  "2026-10-05T09:00:00.000Z",
                ),
            }),
        });

        await expect(
          unitOfWork.execute({
            user:
              makeNewUser({
                id:
                  "new-user",
                email:
                  "alice@example.com",
                passwordHash:
                  "hash",
                now:
                  new Date(
                    "2026-10-05T10:00:00.000Z",
                  ),
              }),
            refreshToken: {
              id:
                "session-new",
              userId:
                "new-user",
              tokenHash:
                "hash",
              expiresAt:
                new Date(
                  "2026-10-06T10:00:00.000Z",
                ),
            },

            events: [
              new UserRegisteredEvent({
                userId:
                  "new-user",

                email:
                  "alice@example.com",

                occurredAt:
                  new Date(
                    "2026-10-05T10:00:00.000Z",
                  ),
              }),
            ],
          }),
        ).rejects.toBeInstanceOf(
          DuplicateUserEmailError,
        );

        expect(
          await prisma.outboxEvent.count(),
        ).toBe(0);
      },
    );
  },
);
