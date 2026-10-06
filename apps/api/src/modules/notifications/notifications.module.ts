import { Inject, Module, type OnModuleInit } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";
import { DomainEventHandlerRegistry } from "@/common/infrastructure/events/domain-event-handler-registry";
import { DomainEventRegistry } from "@/common/infrastructure/events/domain-event-registry";
import { UserRegisteredEvent } from "@/modules/users/domain/events/user-registered.event";

import { SendWelcomeEmailHandler } from "./application/handlers/send-welcome-email.handler";
import type { EmailSender } from "./application/ports/email-sender.port";
import { ConsoleEmailSender } from "./infrastructure/console-email-sender";
import { EMAIL_SENDER } from "./notifications.tokens";

@Module({
  imports: [CommonModule],
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: ConsoleEmailSender,
    },
    {
      provide: SendWelcomeEmailHandler,
      inject: [EMAIL_SENDER],
      useFactory: (emails: EmailSender) => new SendWelcomeEmailHandler(emails),
    },
  ],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    @Inject(DomainEventHandlerRegistry)
    private readonly handlers: DomainEventHandlerRegistry,

    @Inject(DomainEventRegistry)
    private readonly registry: DomainEventRegistry,

    @Inject(SendWelcomeEmailHandler)
    private readonly welcomeEmail: SendWelcomeEmailHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      UserRegisteredEvent.eventName,
      (payload, occurredAt) =>
        UserRegisteredEvent.fromPrimitives(payload, occurredAt),
    );

    this.handlers.register(
      UserRegisteredEvent.eventName,
      this.welcomeEmail,
    );
  }
}
