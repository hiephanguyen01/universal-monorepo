import { NotFoundError } from "@/common/errors";
import type { UserRepository } from "../../domain/repositories/user.repository";

export interface GetCurrentUserOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class GetCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async execute(
    userId: string,
  ): Promise<GetCurrentUserOutput> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
