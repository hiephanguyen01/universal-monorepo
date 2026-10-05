import { Inject, Module, type OnModuleInit } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";

import { DomainEventRegistry } from "@/common/infrastructure/events/domain-event-registry";

import { InMemoryDomainEventDispatcher } from "@/common/infrastructure/events/in-memory-domain-event-dispatcher";

import { UserRegisteredEvent } from "@/modules/users/domain/events/user-registered.event";

import type { EmailSender } from "./application/ports/email-sender.port";

import { SendWelcomeEmailHandler } from "./application/handlers/send-welcome-email.handler";

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
    @Inject(InMemoryDomainEventDispatcher)
    private readonly events: InMemoryDomainEventDispatcher,

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

    this.events.register(
      UserRegisteredEvent.eventName,

      (event) => this.welcomeEmail.handle(event as UserRegisteredEvent),
    );
  }
}
