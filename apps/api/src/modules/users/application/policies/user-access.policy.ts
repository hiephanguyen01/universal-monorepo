import { ForbiddenError } from "@/common/errors";
import type { UserRole } from "@/modules/users/domain/entities/user.entity";
import type { UserId } from "../../domain/value-objects/user-id.vo";

export interface UserActor {
  id: UserId;
  role: UserRole;
}

export class UserAccessPolicy {
  canUpdateProfile(actor: UserActor, targetUserId: UserId): boolean {
    if (actor.role === "ADMIN") {
      return true;
    }

    return actor.id.equals(targetUserId);
  }

  assertCanUpdateProfile(actor: UserActor, targetUserId: UserId): void {
    if (!this.canUpdateProfile(actor, targetUserId)) {
      throw new ForbiddenError("You cannot update this user");
    }
  }
}
