import assert from "node:assert/strict";
import {
  execFileSync,
  spawn,
  type ChildProcess,
} from "node:child_process";

import {
  setTimeout as delay,
} from "node:timers/promises";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import * as argon2 from "argon2";

import {
  PrismaClient,
} from "../../src/generated/prisma/client";

import {
  makePrismaUserData,
} from "../factories/prisma-user.factory";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/app_test?schema=public";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  DEFAULT_DATABASE_URL;

const port =
  Number(
    process.env.E2E_API_PORT ??
      "3109",
  );

const baseUrl =
  `http://127.0.0.1:${port}`;

const pnpmCommand =
  process.platform === "win32"
    ? "pnpm.cmd"
    : "pnpm";

const serverEnv = {
  ...process.env,
  NODE_ENV:
    "test",
  DATABASE_URL:
    databaseUrl,
  TEST_DATABASE_URL:
    databaseUrl,
  API_PORT:
    String(port),
  WEB_ORIGIN:
    "http://localhost:3000",
  JWT_ACCESS_SECRET:
    "e2e-access-secret-value",
  JWT_REFRESH_SECRET:
    "e2e-refresh-secret-value",
};

interface ErrorBody {
  success: false;

  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

interface UserBody {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "BLOCKED";
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthSessionBody {
  accessToken: string;
  refreshToken: string;
  user: UserBody;
}

interface AuthTokensBody {
  accessToken: string;
  refreshToken: string;
}

interface SuccessBody<T> {
  success: true;
  data: T;
}

interface HttpResult<T> {
  status: number;
  body: T;
}

const adapter =
  new PrismaPg({
    connectionString:
      databaseUrl,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

async function clearDatabase(): Promise<void> {
  await prisma.idempotencyRecord.deleteMany();
  await prisma.inboxEvent.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function requestJson<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    accessToken?: string;
    idempotencyKey?: string;
  } = {},
): Promise<HttpResult<T>> {
  const headers:
    Record<string, string> = {
    Accept:
      "application/json",
  };

  if (
    options.body !== undefined
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }

  if (
    options.accessToken
  ) {
    headers.Authorization =
      `Bearer ${options.accessToken}`;
  }

  if (
    options.idempotencyKey
  ) {
    headers["Idempotency-Key"] =
      options.idempotencyKey;
  }

  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        method,
        headers,
        body:
          options.body ===
          undefined
            ? undefined
            : JSON.stringify(
                options.body,
              ),
      },
    );

  return {
    status:
      response.status,
    body:
      (await response
        .json()) as T,
  };
}

function assertStatus<T>(
  result: HttpResult<T>,
  expected: number,
): void {
  assert.equal(
    result.status,
    expected,
    JSON.stringify(
      result.body,
      null,
      2,
    ),
  );
}

async function waitForOutboxProcessed():
  Promise<void> {
  const deadline =
    Date.now() +
    5_000;

  while (
    Date.now() <
    deadline
  ) {
    const event =
      await prisma.outboxEvent
        .findFirst({
          orderBy: {
            createdAt:
              "desc",
          },
        });

    if (
      event?.processedAt
    ) {
      return;
    }

    await delay(
      100,
    );
  }

  throw new Error(
    "Timed out waiting for outbox delivery",
  );
}

async function registerUser(
  email =
    "alice@example.com",
): Promise<AuthSessionBody> {
  const result =
    await requestJson<
      SuccessBody<AuthSessionBody>
    >(
      "POST",
      "/api/v1/auth/register",
      {
        body: {
          email,
          password:
            "password123",
          fullName:
            "Alice",
        },
      },
    );

  assertStatus(
    result,
    201,
  );

  return result.body.data;
}

async function waitForServer(
  server: ChildProcess,
): Promise<void> {
  const deadline =
    Date.now() +
    30_000;

  while (
    Date.now() <
    deadline
  ) {
    if (
      server.exitCode !==
      null
    ) {
      throw new Error(
        `API process exited with code ${server.exitCode}`,
      );
    }

    try {
      const response =
        await fetch(
          `${baseUrl}/api/v1/users/me`,
        );

      if (
        response.status >
        0
      ) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(
      250,
    );
  }

  throw new Error(
    "Timed out waiting for API server",
  );
}

async function stopServer(
  server: ChildProcess,
): Promise<void> {
  if (
    server.exitCode !==
    null
  ) {
    return;
  }

  server.kill(
    "SIGTERM",
  );

  await Promise.race([
    new Promise<void>(
      (resolve) => {
        server.once(
          "exit",
          () =>
            resolve(),
        );
      },
    ),
    delay(
      5_000,
    ).then(
      () => {
        if (
          server.exitCode ===
          null
        ) {
          server.kill(
            "SIGKILL",
          );
        }
      },
    ),
  ]);
}

async function runTest(
  name: string,
  test: () =>
    Promise<void>,
): Promise<void> {
  await clearDatabase();

  try {
    await test();
    process.stdout.write(
      `✓ ${name}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `✗ ${name}\n`,
    );

    throw error;
  }
}

async function main():
  Promise<void> {
  execFileSync(
    pnpmCommand,
    [
      "exec",
      "prisma",
      "migrate",
      "deploy",
      "--config",
      "prisma7.config.ts",
    ],
    {
      cwd:
        process.cwd(),
      stdio:
        "inherit",
      env:
        serverEnv,
    },
  );

  await prisma.$connect();

  const server =
    spawn(
      pnpmCommand,
      [
        "exec",
        "nest",
        "start",
      ],
      {
        cwd:
          process.cwd(),
        env:
          serverEnv,
        stdio:
          "inherit",
      },
    );

  try {
    await waitForServer(
      server,
    );

    await runTest(
      "registers a normalized user and persists the session",
      async () => {
        const result =
          await requestJson<
            SuccessBody<AuthSessionBody>
          >(
            "POST",
            "/api/v1/auth/register",
            {
              body: {
                email:
                  "ALICE@example.com",
                password:
                  "password123",
                fullName:
                  "  Alice  ",
              },
            },
          );

        assertStatus(
          result,
          201,
        );

        assert.equal(
          result.body.success,
          true,
        );

        assert.equal(
          result.body.data
            .user.email,
          "alice@example.com",
        );

        assert.equal(
          result.body.data
            .user.fullName,
          "Alice",
        );

        assert.equal(
          result.body.data
            .user.version,
          0,
        );

        assert.ok(
          result.body.data
            .accessToken,
        );

        assert.ok(
          result.body.data
            .refreshToken,
        );

        assert.equal(
          await prisma.user
            .count(),
          1,
        );

        assert.equal(
          await prisma
            .refreshToken
            .count(),
          1,
        );

        assert.equal(
          await prisma.outboxEvent
            .count(),
          1,
        );

        await waitForOutboxProcessed();

        const outboxEvent =
          await prisma.outboxEvent
            .findFirstOrThrow();

        assert.ok(
          outboxEvent
            .processedAt,
        );

        const inboxEvent =
          await prisma.inboxEvent
            .findFirstOrThrow();

        assert.ok(
          inboxEvent
            .processedAt,
        );

        assert.equal(
          inboxEvent
            .handlerName,
          "notifications.send-welcome-email.v1",
        );
      },
    );

    await runTest(
      "rejects invalid registration input before persistence",
      async () => {
        const result =
          await requestJson<
            ErrorBody
          >(
            "POST",
            "/api/v1/auth/register",
            {
              body: {
                email:
                  "not-an-email",
                password:
                  "123",
                fullName:
                  "A",
              },
            },
          );

        assertStatus(
          result,
          400,
        );

        assert.equal(
          result.body.error
            .code,
          "HTTP_ERROR",
        );

        assert.equal(
          await prisma.user
            .count(),
          0,
        );
      },
    );

    await runTest(
      "returns 409 for duplicate email",
      async () => {
        await registerUser();

        const result =
          await requestJson<
            ErrorBody
          >(
            "POST",
            "/api/v1/auth/register",
            {
              body: {
                email:
                  "ALICE@example.com",
                password:
                  "password123",
                fullName:
                  "Alice Two",
              },
            },
          );

        assertStatus(
          result,
          409,
        );

        assert.equal(
          result.body.error
            .code,
          "EMAIL_ALREADY_EXISTS",
        );
      },
    );

    await runTest(
      "protects current-user endpoint with JWT",
      async () => {
        const unauthorized =
          await requestJson<
            ErrorBody
          >(
            "GET",
            "/api/v1/users/me",
          );

        assertStatus(
          unauthorized,
          401,
        );

        const session =
          await registerUser();

        const authorized =
          await requestJson<
            SuccessBody<UserBody>
          >(
            "GET",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
            },
          );

        assertStatus(
          authorized,
          200,
        );

        assert.equal(
          authorized.body.data
            .email,
          "alice@example.com",
        );

        assert.equal(
          authorized.body.data
            .version,
          0,
        );
      },
    );

    await runTest(
      "rejects stale profile versions end to end",
      async () => {
        const session =
          await registerUser();

        const first =
          await requestJson<
            SuccessBody<UserBody>
          >(
            "PATCH",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
              body: {
                fullName:
                  "Alice Smith",
                version:
                  0,
              },
            },
          );

        assertStatus(
          first,
          200,
        );

        assert.equal(
          first.body.data
            .version,
          1,
        );

        const stale =
          await requestJson<
            ErrorBody
          >(
            "PATCH",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
              body: {
                fullName:
                  "Alice Nguyen",
                version:
                  0,
              },
            },
          );

        assertStatus(
          stale,
          409,
        );

        assert.equal(
          stale.body.error
            .code,
          "USER_CONCURRENT_MODIFICATION",
        );
      },
    );

    await runTest(
      "replays current-user updates by idempotency key",
      async () => {
        const session =
          await registerUser();

        const first =
          await requestJson<
            SuccessBody<UserBody>
          >(
            "PATCH",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
              idempotencyKey:
                "profile-update-1",
              body: {
                fullName:
                  "Alice Smith",
                version:
                  0,
              },
            },
          );

        assertStatus(
          first,
          200,
        );

        const replay =
          await requestJson<
            SuccessBody<UserBody>
          >(
            "PATCH",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
              idempotencyKey:
                "profile-update-1",
              body: {
                fullName:
                  "Alice Smith",
                version:
                  0,
              },
            },
          );

        assertStatus(
          replay,
          200,
        );

        assert.deepEqual(
          replay.body.data,
          first.body.data,
        );

        assert.equal(
          await prisma.user
            .findFirstOrThrow()
            .then(
              (user) =>
                user.version,
            ),
          1,
        );

        assert.equal(
          await prisma
            .idempotencyRecord
            .count(),
          1,
        );

        const conflict =
          await requestJson<
            ErrorBody
          >(
            "PATCH",
            "/api/v1/users/me",
            {
              accessToken:
                session
                  .accessToken,
              idempotencyKey:
                "profile-update-1",
              body: {
                fullName:
                  "Alice Nguyen",
                version:
                  0,
              },
            },
          );

        assertStatus(
          conflict,
          409,
        );

        assert.equal(
          conflict.body.error
            .code,
          "IDEMPOTENCY_KEY_REUSED",
        );
      },
    );

    await runTest(
      "rotates refresh tokens and rejects replay",
      async () => {
        const session =
          await registerUser();

        const refreshed =
          await requestJson<
            SuccessBody<AuthTokensBody>
          >(
            "POST",
            "/api/v1/auth/refresh",
            {
              body: {
                refreshToken:
                  session
                    .refreshToken,
              },
            },
          );

        assertStatus(
          refreshed,
          200,
        );

        assert.notEqual(
          refreshed.body.data
            .refreshToken,
          session.refreshToken,
        );

        const replay =
          await requestJson<
            ErrorBody
          >(
            "POST",
            "/api/v1/auth/refresh",
            {
              body: {
                refreshToken:
                  session
                    .refreshToken,
              },
            },
          );

        assertStatus(
          replay,
          401,
        );
      },
    );

    await runTest(
      "forbids USER and allows ADMIN to list users",
      async () => {
        const userSession =
          await registerUser();

        const forbidden =
          await requestJson<
            ErrorBody
          >(
            "GET",
            "/api/v1/users",
            {
              accessToken:
                userSession
                  .accessToken,
            },
          );

        assertStatus(
          forbidden,
          403,
        );

        const passwordHash =
          await argon2.hash(
            "password123",
          );

        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        await prisma.user
          .create({
            data:
              makePrismaUserData({
                id:
                  "admin-1",
                email:
                  "admin@example.com",
                passwordHash,
                fullName:
                  "Admin",
                role:
                  "ADMIN",
                createdAt:
                  now,
                updatedAt:
                  now,
              }),
          });

        const login =
          await requestJson<
            SuccessBody<AuthSessionBody>
          >(
            "POST",
            "/api/v1/auth/login",
            {
              body: {
                email:
                  "admin@example.com",
                password:
                  "password123",
              },
            },
          );

        assertStatus(
          login,
          200,
        );

        const list =
          await requestJson<
            SuccessBody<{
              items:
                UserBody[];
              meta: {
                page:
                  number;
                pageSize:
                  number;
                total:
                  number;
                totalPages:
                  number;
              };
            }>
          >(
            "GET",
            "/api/v1/users",
            {
              accessToken:
                login.body
                  .data
                  .accessToken,
            },
          );

        assertStatus(
          list,
          200,
        );

        assert.equal(
          list.body.data
            .items.length,
          2,
        );
      },
    );

    process.stdout.write(
      "E2E suite passed\n",
    );
  } finally {
    await stopServer(
      server,
    );

    await prisma
      .$disconnect();
  }
}

void main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);
