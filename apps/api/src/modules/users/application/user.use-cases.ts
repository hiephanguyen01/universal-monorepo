import { NotFoundError } from "@/common/errors";
import type { UserRepository } from "@/modules/users/domain/user";
export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }
}
export class UpdateCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}
  execute(userId: string, fullName: string) {
    return this.users.updateProfile(userId, { fullName });
  }
}
