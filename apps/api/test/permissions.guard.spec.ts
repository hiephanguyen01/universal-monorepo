import {
  ForbiddenException,
  type ExecutionContext,
} from "@nestjs/common";

import type {
  Reflector,
} from "@nestjs/core";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PERMISSIONS,
} from "../src/modules/auth/authorization/permissions";

import {
  PermissionsGuard,
} from "../src/modules/auth/presentation/guards/permissions.guard";

import type {
  AuthenticatedUser,
} from "../src/modules/auth/presentation/types/authenticated-user";

function createContext(
  user?: AuthenticatedUser,
): ExecutionContext {
  return {
    getHandler: () =>
      function handler() {},
    getClass: () =>
      class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        user,
      }),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  it("allows admin with users.read", () => {
    const reflector = {
      getAllAndOverride: vi.fn(() => [
        PERMISSIONS.USERS_READ,
      ]),
    } as unknown as Reflector;

    const guard = new PermissionsGuard(
      reflector,
    );

    expect(
      guard.canActivate(
        createContext({
          id: "admin-1",
          email: "admin@example.com",
          role: "ADMIN",
        }),
      ),
    ).toBe(true);
  });

  it("rejects user without users.read", () => {
    const reflector = {
      getAllAndOverride: vi.fn(() => [
        PERMISSIONS.USERS_READ,
      ]),
    } as unknown as Reflector;

    const guard = new PermissionsGuard(
      reflector,
    );

    expect(() =>
      guard.canActivate(
        createContext({
          id: "user-1",
          email: "user@example.com",
          role: "USER",
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows access when endpoint has no permission metadata", () => {
    const reflector = {
      getAllAndOverride: vi.fn(
        () => undefined,
      ),
    } as unknown as Reflector;

    const guard = new PermissionsGuard(
      reflector,
    );

    expect(
      guard.canActivate(
        createContext({
          id: "user-1",
          email: "user@example.com",
          role: "USER",
        }),
      ),
    ).toBe(true);
  });
});
