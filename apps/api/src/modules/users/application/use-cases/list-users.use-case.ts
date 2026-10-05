import { UserRepository } from "../../domain/repositories/user.repository";
import { UserOutput } from "../dto/user-output";
import { UserOutputMapper } from "../mappers/user-output.mapper";

export interface ListUsersInput {
  page: number;
  pageSize: number;
}

export interface ListUsersOutput {
  items: UserOutput[];

  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    const [users, total] = await Promise.all([
      this.users.findMany({
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),

      this.users.count(),
    ]);

    return {
      items: users.map(UserOutputMapper.toOutput),

      meta: {
        page: input.page,

        pageSize: input.pageSize,

        total,

        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  }
}
