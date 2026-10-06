// apps/api/src/app.module.ts

import { Module } from "@nestjs/common";

import { MaintenanceModule } from "@/infrastructure/maintenance/maintenance.module";
import { OutboxModule } from "@/infrastructure/outbox/outbox.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { UsersModule } from "@/modules/users/users.module";

@Module({
  imports: [
    NotificationsModule,
    OutboxModule,
    MaintenanceModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
