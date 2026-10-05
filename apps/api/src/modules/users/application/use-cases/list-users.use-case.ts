import type { UserRepository } from "../../domain/repositories/user.repository";

export interface ListUsersInput {
  page: number;
  pageSize: number;
}

export interface ListUsersOutput {
  items: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class ListUsersUseCase {
  constructor(
    private readonly users:
      UserRepository,
  ) {}

  async execute(
    input: ListUsersInput,
  ): Promise<ListUsersOutput> {
    const [
      users,
      total,
    ] =
      await Promise.all([
        this.users.findMany({
          skip:
            (input.page - 1) *
            input.pageSize,
          take:
            input.pageSize,
        }),

        this.users.count(),
      ]);

    return {
      items:
        users.map(
          (user) => ({
            id: user.id,
            email: user.email.value,
            fullName:
              user.fullName,
            role: user.role,
            status:
              user.status,
            createdAt:
              user.createdAt.toISOString(),
            updatedAt:
              user.updatedAt.toISOString(),
          }),
        ),

      meta: {
        page: input.page,
        pageSize:
          input.pageSize,
        total,
        totalPages:
          Math.ceil(
            total /
              input.pageSize,
          ),
      },
    };
  }
}
