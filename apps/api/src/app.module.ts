// apps/api/src/app.module.ts

import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";

import {
  NotificationsModule,
} from "@/modules/notifications/notifications.module";

import { UsersModule } from "@/modules/users/users.module";

@Module({
  imports: [
    NotificationsModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
