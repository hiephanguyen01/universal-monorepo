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
  User,
} from "@/modules/users/domain/entities/user.entity";

import {
  Email,
} from "@/modules/users/domain/value-objects/email.vo";

import {
  UserId,
} from "@/modules/users/domain/value-objects/user-id.vo";

import {
  clearDatabase,
  createTestPrisma,
} from "./helpers/test-database";

function createUser(
  id: string,
  email: string,
): User {
  return User.create({
    id:
      UserId.create(id),
    email:
      Email.create(email),
    passwordHash:
      "hash",
    fullName:
      "Alice",
    now:
      new Date(
        "2026-10-05T10:00:00.000Z",
      ),
  });
}

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
            createUser(
              "user-1",
              "alice@example.com",
            ),
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
        });

        expect(
          await prisma.user.count(),
        ).toBe(1);

        expect(
          await prisma.refreshToken.count(),
        ).toBe(1);
      },
    );

    it(
      "rolls back user insert when refresh token insert fails",
      async () => {
        await prisma.user.create({
          data: {
            id:
              "existing-user",
            email:
              "existing@example.com",
            passwordHash:
              "hash",
            fullName:
              "Existing",
            role:
              "USER",
            status:
              "ACTIVE",
            version:
              0,
            createdAt:
              new Date(
                "2026-10-05T09:00:00.000Z",
              ),
            updatedAt:
              new Date(
                "2026-10-05T09:00:00.000Z",
              ),
          },
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
              createUser(
                "new-user",
                "new@example.com",
              ),
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
      },
    );

    it(
      "maps duplicate email to DuplicateUserEmailError",
      async () => {
        await prisma.user.create({
          data: {
            id:
              "existing-user",
            email:
              "alice@example.com",
            passwordHash:
              "hash",
            fullName:
              "Existing",
            role:
              "USER",
            status:
              "ACTIVE",
            version:
              0,
            createdAt:
              new Date(
                "2026-10-05T09:00:00.000Z",
              ),
            updatedAt:
              new Date(
                "2026-10-05T09:00:00.000Z",
              ),
          },
        });

        await expect(
          unitOfWork.execute({
            user:
              createUser(
                "new-user",
                "alice@example.com",
              ),
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
          }),
        ).rejects.toBeInstanceOf(
          DuplicateUserEmailError,
        );
      },
    );
  },
);
