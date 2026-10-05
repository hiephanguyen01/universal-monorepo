export type DomainEventValue =
  | string
  | number
  | boolean
  | null
  | DomainEventValue[]
  | {
      [key: string]:
        DomainEventValue;
    };

export type DomainEventPayload =
  Record<
    string,
    DomainEventValue
  >;

export interface DomainEvent {
  readonly eventName:
    string;

  readonly occurredAt:
    Date;

  toPrimitives():
    DomainEventPayload;
}
