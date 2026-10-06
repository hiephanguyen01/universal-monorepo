import { describe, expect, it } from "vitest";

import { SendWelcomeEmailHandler } from "../src/modules/notifications/application/handlers/send-welcome-email.handler";
import type {
  EmailSender,
  SendEmailInput,
} from "../src/modules/notifications/application/ports/email-sender.port";
import { UserRegisteredEvent } from "../src/modules/users/domain/events/user-registered.event";

class FakeEmailSender implements EmailSender {
  readonly sent: SendEmailInput[] = [];

  send(input: SendEmailInput): Promise<void> {
    this.sent.push(input);
    return Promise.resolve();
  }
}

describe("SendWelcomeEmailHandler", () => {
  it("sends a welcome email to the registered user", async () => {
    const emails = new FakeEmailSender();
    const handler = new SendWelcomeEmailHandler(emails);

    await handler.handle(
      new UserRegisteredEvent({
        userId: "user-1",
        email: "alice@example.com",
        occurredAt: new Date("2026-10-05T10:00:00.000Z"),
      }),
      {
        eventId: "event-1",
      },
    );

    expect(emails.sent).toEqual([
      {
        to: "alice@example.com",
        subject: "Welcome",
        text: "Welcome to the platform!",
        idempotencyKey: "event-1",
      },
    ]);
  });
});
