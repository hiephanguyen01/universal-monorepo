export interface SendEmailInput {
  to: string;

  subject: string;

  text: string;

  idempotencyKey: string;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}
