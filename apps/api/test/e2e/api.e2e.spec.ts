import type {
  INestApplication,
} from "@nestjs/common";

import {
  NestFactory,
} from "@nestjs/core";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  AppModule,
} from "@/app.module";

import {
  configureApp,
} from "@/bootstrap/configure-app";

import {
  PrismaService,
} from "@/infrastructure/prisma/prisma.service";

import {
  ArgonPasswordHasher,
} from "@/modules/auth/infrastructure/security/argon-password-hasher";

import {
  clearDatabase,
} from "../helpers/test-database";

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
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
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

describe(
  "API E2E",
  () => {
    let app:
      INestApplication;

    let baseUrl:
      string;

    let prisma:
      PrismaService;

    const requestJson =
      async <T>(
        method: string,
        path: string,
        options: {
          body?: unknown;
          accessToken?: string;
        } = {},
      ): Promise<HttpResult<T>> => {
        const headers:
          Record<string, string> = {
          Accept:
            "application/json",
        };

        if (
          options.body !==
          undefined
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

        const body =
          (await response
            .json()) as T;

        return {
          status:
            response.status,
          body,
        };
      };

    const registerUser =
      async (
        email =
          "alice@example.com",
      ): Promise<AuthSessionBody> => {
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

        expect(
          result.status,
        ).toBe(201);

        return result.body.data;
      };

    beforeAll(
      async () => {
        app =
          await NestFactory
            .create(
              AppModule,
              {
                abortOnError:
                  false,

                logger: [
                  "error",
                ],
              },
            );

        configureApp(
          app,
        );

        await app.listen(
          0,
          "127.0.0.1",
        );

        baseUrl =
          await app.getUrl();

        prisma =
          app.get(
            PrismaService,
          );
      },
      60_000,
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
        await app.close();
      },
    );

    it(
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

        expect(
          result.status,
        ).toBe(201);

        expect(
          result.body.success,
        ).toBe(true);

        expect(
          result.body.data.user,
        ).toMatchObject({
          email:
            "alice@example.com",
          fullName:
            "Alice",
          role:
            "USER",
          status:
            "ACTIVE",
          version:
            0,
        });

        expect(
          result.body.data
            .accessToken,
        ).toEqual(
          expect.any(
            String,
          ),
        );

        expect(
          result.body.data
            .refreshToken,
        ).toEqual(
          expect.any(
            String,
          ),
        );

        expect(
          await prisma.user
            .count(),
        ).toBe(1);

        expect(
          await prisma
            .refreshToken
            .count(),
        ).toBe(1);
      },
    );

    it(
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

        expect(
          result.status,
        ).toBe(400);

        expect(
          result.body,
        ).toMatchObject({
          success:
            false,
          error: {
            code:
              "HTTP_ERROR",
          },
        });

        expect(
          await prisma.user
            .count(),
        ).toBe(0);
      },
    );

    it(
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

        expect(
          result.status,
        ).toBe(409);

        expect(
          result.body,
        ).toMatchObject({
          success:
            false,
          error: {
            code:
              "EMAIL_ALREADY_EXISTS",
          },
        });
      },
    );

    it(
      "protects current-user endpoint with JWT",
      async () => {
        const unauthorized =
          await requestJson<
            ErrorBody
          >(
            "GET",
            "/api/v1/users/me",
          );

        expect(
          unauthorized.status,
        ).toBe(401);

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

        expect(
          authorized.status,
        ).toBe(200);

        expect(
          authorized.body.data,
        ).toMatchObject({
          email:
            "alice@example.com",
          version:
            0,
        });
      },
    );

    it(
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

        expect(
          first.status,
        ).toBe(200);

        expect(
          first.body.data
            .version,
        ).toBe(1);

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

        expect(
          stale.status,
        ).toBe(409);

        expect(
          stale.body,
        ).toMatchObject({
          success:
            false,
          error: {
            code:
              "USER_CONCURRENT_MODIFICATION",
          },
        });
      },
    );

    it(
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

        expect(
          refreshed.status,
        ).toBe(200);

        expect(
          refreshed.body.data
            .refreshToken,
        ).not.toBe(
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

        expect(
          replay.status,
        ).toBe(401);
      },
    );

    it(
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

        expect(
          forbidden.status,
        ).toBe(403);

        const passwordHasher =
          new ArgonPasswordHasher();

        const passwordHash =
          await passwordHasher
            .hash(
              "password123",
            );

        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        await prisma.user
          .create({
            data: {
              id:
                "admin-1",
              email:
                "admin@example.com",
              passwordHash,
              fullName:
                "Admin",
              role:
                "ADMIN",
              status:
                "ACTIVE",
              version:
                0,
              createdAt:
                now,
              updatedAt:
                now,
            },
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

        expect(
          login.status,
        ).toBe(200);

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

        expect(
          list.status,
        ).toBe(200);

        expect(
          list.body.data
            .items.length,
        ).toBe(2);
      },
    );
  },
);
