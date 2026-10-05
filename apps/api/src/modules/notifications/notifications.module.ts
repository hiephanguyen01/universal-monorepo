import {
  Inject,
  Module,
  type OnModuleInit,
} from "@nestjs/common";

import {
  CommonModule,
} from "@/common/common.module";

import {
  InMemoryDomainEventDispatcher,
} from "@/common/infrastructure/events/in-memory-domain-event-dispatcher";

import {
  UserRegisteredEvent,
} from "@/modules/users/domain/events/user-registered.event";

import type {
  EmailSender,
} from "./application/ports/email-sender.port";

import {
  SendWelcomeEmailHandler,
} from "./application/handlers/send-welcome-email.handler";

import {
  ConsoleEmailSender,
} from "./infrastructure/console-email-sender";

import {
  EMAIL_SENDER,
} from "./notifications.tokens";

@Module({
  imports: [
    CommonModule,
  ],
  providers: [
    {
      provide:
        EMAIL_SENDER,
      useClass:
        ConsoleEmailSender,
    },
    {
      provide:
        SendWelcomeEmailHandler,

      inject: [
        EMAIL_SENDER,
      ],

      useFactory: (
        emails:
          EmailSender,
      ) =>
        new SendWelcomeEmailHandler(
          emails,
        ),
    },
  ],
})
export class NotificationsModule
  implements OnModuleInit
{
  constructor(
    @Inject(
      InMemoryDomainEventDispatcher,
    )
    private readonly events:
      InMemoryDomainEventDispatcher,

    @Inject(
      SendWelcomeEmailHandler,
    )
    private readonly welcomeEmail:
      SendWelcomeEmailHandler,
  ) {}

  onModuleInit(): void {
    this.events.register(
      UserRegisteredEvent,

      (event) =>
        this.welcomeEmail
          .handle(
            event,
          ),
    );
  }
}
