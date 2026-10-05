import {
  Injectable,
} from "@nestjs/common";

import type {
  EmailSender,
  SendEmailInput,
} from "../application/ports/email-sender.port";

@Injectable()
export class ConsoleEmailSender
  implements EmailSender
{
  send(
    input: SendEmailInput,
  ): Promise<void> {
    console.log(
      "[EMAIL]",
      input,
    );

    return Promise.resolve();
  }
}
