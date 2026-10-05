import type { DomainEvent } from "@/common/domain/domain-event";

export interface UserRegisteredEventProps {
  userId: string;

  email: string;

  occurredAt: Date;
}

export class UserRegisteredEvent implements DomainEvent {
  readonly userId: string;

  readonly email: string;

  readonly occurredAt: Date;

  constructor(props: UserRegisteredEventProps) {
    this.userId = props.userId;

    this.email = props.email;

    this.occurredAt = props.occurredAt;
  }
}
