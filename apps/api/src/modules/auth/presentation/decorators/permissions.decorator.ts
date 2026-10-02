import { SetMetadata } from "@nestjs/common";

import type { Permission } from "../../authorization/permissions";

export const PERMISSIONS_KEY = "permissions";

export const Permissions = (permissions: readonly Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
