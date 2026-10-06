import type { DomainEventHandlerContext } from "@/common/domain/domain-event-handler-context";

import type { RegisteredDomainEventHandler } from "@/common/domain/registered-domain-event-handler";
import { UserRegisteredEvent } from "@/modules/users/domain/events/user-registered.event";
import { EmailSender } from "../ports/email-sender.port";

export class SendWelcomeEmailHandler implements RegisteredDomainEventHandler<UserRegisteredEvent> {
  readonly handlerName = "notifications.send-welcome-email.v1";

  constructor(private readonly emails: EmailSender) {}

  handle(
    event: UserRegisteredEvent,

    context: DomainEventHandlerContext,
  ): Promise<void> {
    return this.emails.send({
      to: event.email,

      subject: "Welcome",

      text: "Welcome to the platform!",

      idempotencyKey: context.eventId,
    });
  }
}
