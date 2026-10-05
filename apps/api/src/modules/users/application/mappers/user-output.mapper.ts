import type { User } from "../../domain/entities/user.entity";

import type { UserOutput } from "../dto/user-output";

export class UserOutputMapper {
  static toOutput(user: User): UserOutput {
    return {
      id: user.id.value,

      email: user.email.value,

      fullName: user.fullName,

      role: user.role,

      status: user.status,

      version: user.version,

      createdAt: user.createdAt.toISOString(),

      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
