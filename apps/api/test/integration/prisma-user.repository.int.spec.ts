import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  UserVersionConflictError,
} from "@/modules/users/application/errors/user-version-conflict.error";

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
  PrismaUserRepository,
} from "@/modules/users/infrastructure/prisma-user.repository";

import {
  clearDatabase,
  createTestPrisma,
} from "../helpers/test-database";

describe(
  "PrismaUserRepository integration",
  () => {
    const prisma =
      createTestPrisma();

    const repository =
      new PrismaUserRepository(
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
      "creates and restores a user",
      async () => {
        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        const user =
          User.create({
            id:
              UserId.create(
                "user-1",
              ),
            email:
              Email.create(
                "alice@example.com",
              ),
            passwordHash:
              "hash",
            fullName:
              "Alice",
            now,
          });

        const saved =
          await repository.create(
            user,
          );

        expect(
          saved.id.value,
        ).toBe(
          "user-1",
        );

        expect(
          saved.email.value,
        ).toBe(
          "alice@example.com",
        );

        expect(
          saved.version,
        ).toBe(0);
      },
    );

    it(
      "rejects a stale user version",
      async () => {
        const original =
          User.create({
            id:
              UserId.create(
                "user-1",
              ),
            email:
              Email.create(
                "alice@example.com",
              ),
            passwordHash:
              "hash",
            fullName:
              "Alice",
            now:
              new Date(
                "2026-01-01T00:00:00.000Z",
              ),
          });

        await repository.create(
          original,
        );

        const first =
          await repository.findById(
            UserId.create(
              "user-1",
            ),
          );

        const second =
          await repository.findById(
            UserId.create(
              "user-1",
            ),
          );

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();

        first!.changeFullName(
          "Alice A",
          new Date(
            "2026-10-05T10:00:00.000Z",
          ),
        );

        const savedFirst =
          await repository.save(
            first!,
          );

        expect(
          savedFirst.version,
        ).toBe(1);

        second!.changeFullName(
          "Alice B",
          new Date(
            "2026-10-05T11:00:00.000Z",
          ),
        );

        await expect(
          repository.save(
            second!,
          ),
        ).rejects.toBeInstanceOf(
          UserVersionConflictError,
        );
      },
    );
  },
);
