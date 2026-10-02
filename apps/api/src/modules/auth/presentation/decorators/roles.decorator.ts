import { SetMetadata } from "@nestjs/common";
import type { AuthenticatedRole } from "../types/authenticated-user";

export const ROLES_KEY = "roles";

export const Roles = (
  ...roles: AuthenticatedRole[]
) =>
  SetMetadata(
    ROLES_KEY,
    roles,
  );
