import { ForbiddenError } from "@/common/errors";
import type { UserRole } from "@/modules/users/domain/entities/user.entity";

export interface UserActor {
  id: string;
  role: UserRole;
}

export class UserAccessPolicy {
  canUpdateProfile(actor: UserActor, targetUserId: string): boolean {
    if (actor.role === "ADMIN") {
      return true;
    }

    return actor.id === targetUserId;
  }

  assertCanUpdateProfile(actor: UserActor, targetUserId: string): void {
    if (!this.canUpdateProfile(actor, targetUserId)) {
      throw new ForbiddenError("You cannot update this user");
    }
  }
}
