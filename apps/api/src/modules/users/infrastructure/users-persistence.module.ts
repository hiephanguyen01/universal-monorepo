// apps/api/src/modules/users/infrastructure/users-persistence.module.ts

import { Module } from "@nestjs/common";

import { USER_REPOSITORY } from "../users.tokens";

import { PrismaModule } from "@/infrastructure/prisma/prisma.module";
import { PrismaUserRepository } from "./prisma-user.repository";

@Module({
  imports: [PrismaModule],

  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],

  exports: [USER_REPOSITORY],
})
export class UsersPersistenceModule {}
