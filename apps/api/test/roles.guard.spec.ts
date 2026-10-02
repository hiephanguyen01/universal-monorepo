import {
  ForbiddenException,
  type ExecutionContext,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { RolesGuard } from "../src/modules/auth/presentation/guards/roles.guard";
import type { AuthenticatedUser } from "../src/modules/auth/presentation/types/authenticated-user";

function createContext(
  user: AuthenticatedUser,
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

describe(
  "RolesGuard",
  () => {
    it(
      "allows an admin when ADMIN is required",
      () => {
        const reflector = {
          getAllAndOverride:
            vi.fn(() => [
              "ADMIN",
            ]),
        } as unknown as Reflector;

        const guard =
          new RolesGuard(
            reflector,
          );

        expect(
          guard.canActivate(
            createContext({
              id: "admin-1",
              email:
                "admin@example.com",
              role: "ADMIN",
            }),
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a regular user when ADMIN is required",
      () => {
        const reflector = {
          getAllAndOverride:
            vi.fn(() => [
              "ADMIN",
            ]),
        } as unknown as Reflector;

        const guard =
          new RolesGuard(
            reflector,
          );

        expect(() =>
          guard.canActivate(
            createContext({
              id: "user-1",
              email:
                "user@example.com",
              role: "USER",
            }),
          ),
        ).toThrow(
          ForbiddenException,
        );
      },
    );
  },
);
