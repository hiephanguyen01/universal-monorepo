import type {
  DomainEventHandler,
} from "@/common/domain/domain-event-handler";

import type {
  UserRegisteredEvent,
} from "@/modules/users/domain/events/user-registered.event";

import type {
  EmailSender,
} from "../ports/email-sender.port";

export class SendWelcomeEmailHandler
  implements
    DomainEventHandler<
      UserRegisteredEvent
    >
{
  constructor(
    private readonly emails:
      EmailSender,
  ) {}

  handle(
    event:
      UserRegisteredEvent,
  ): Promise<void> {
    return this.emails
      .send({
        to:
          event.email,

        subject:
          "Welcome",

        text:
          "Welcome to the platform!",
      });
  }
}
