import { Module } from "@nestjs/common";

import { PrismaModule } from "@/infrastructure/prisma/prisma.module";

import {
  CURRENT_USER_UPDATE_UNIT_OF_WORK,
  USER_REPOSITORY,
} from "../users.tokens";
import { PrismaCurrentUserUpdateUnitOfWork } from "./prisma-current-user-update-unit-of-work";
import { PrismaUserRepository } from "./prisma-user.repository";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide:
        CURRENT_USER_UPDATE_UNIT_OF_WORK,
      useClass:
        PrismaCurrentUserUpdateUnitOfWork,
    },
  ],
  exports: [
    USER_REPOSITORY,
    CURRENT_USER_UPDATE_UNIT_OF_WORK,
  ],
})
export class UsersPersistenceModule {}
