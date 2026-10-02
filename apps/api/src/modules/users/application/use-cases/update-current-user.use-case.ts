import { NotFoundError } from "@/common/errors";
import type { UserRepository } from "../../domain/repositories/user.repository";

export interface UpdateCurrentUserInput {
  fullName: string;
}

export interface UpdateCurrentUserOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class UpdateCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UpdateCurrentUserOutput> {
    const currentUser = await this.users.findById(userId);

    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const user = await this.users.updateProfile(userId, {
      fullName: input.fullName.trim(),
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
