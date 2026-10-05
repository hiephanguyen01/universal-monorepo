import type {
  DomainEvent,
  DomainEventPayload,
} from "@/common/domain/domain-event";

export interface UserRegisteredEventProps {
  userId: string;
  email: string;
  occurredAt: Date;
}

export class UserRegisteredEvent
  implements DomainEvent
{
  static readonly eventName =
    "users.user-registered.v1";

  readonly eventName =
    UserRegisteredEvent
      .eventName;

  readonly userId:
    string;

  readonly email:
    string;

  readonly occurredAt:
    Date;

  constructor(
    props:
      UserRegisteredEventProps,
  ) {
    this.userId =
      props.userId;

    this.email =
      props.email;

    this.occurredAt =
      props.occurredAt;
  }

  toPrimitives():
    DomainEventPayload {
    return {
      userId:
        this.userId,

      email:
        this.email,
    };
  }

  static fromPrimitives(
    payload: unknown,
    occurredAt: Date,
  ): UserRegisteredEvent {
    if (
      typeof payload !==
        "object" ||
      payload === null
    ) {
      throw new Error(
        "Invalid UserRegisteredEvent payload",
      );
    }

    const data =
      payload as Record<
        string,
        unknown
      >;

    if (
      typeof data.userId !==
        "string" ||
      typeof data.email !==
        "string"
    ) {
      throw new Error(
        "Invalid UserRegisteredEvent payload",
      );
    }

    return new UserRegisteredEvent({
      userId:
        data.userId,

      email:
        data.email,

      occurredAt,
    });
  }
}
