import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  InMemoryDomainEventDispatcher,
} from "../src/common/infrastructure/events/in-memory-domain-event-dispatcher";

import {
  UserRegisteredEvent,
} from "../src/modules/users/domain/events/user-registered.event";

describe(
  "InMemoryDomainEventDispatcher",
  () => {
    it(
      "dispatches an event to registered handlers",
      async () => {
        const dispatcher =
          new InMemoryDomainEventDispatcher();

        const handler =
          vi.fn(
            () =>
              Promise.resolve(),
          );

        dispatcher.register(
          UserRegisteredEvent
            .eventName,
          handler,
        );

        const event =
          new UserRegisteredEvent({
            userId:
              "user-1",

            email:
              "alice@example.com",

            occurredAt:
              new Date(
                "2026-10-05T10:00:00.000Z",
              ),
          });

        await dispatcher
          .dispatch(
            event,
          );

        expect(
          handler,
        ).toHaveBeenCalledOnce();

        expect(
          handler,
        ).toHaveBeenCalledWith(
          event,
        );
      },
    );

    it(
      "does nothing when no handler is registered",
      async () => {
        const dispatcher =
          new InMemoryDomainEventDispatcher();

        await expect(
          dispatcher.dispatch(
            new UserRegisteredEvent({
              userId:
                "user-1",

              email:
                "alice@example.com",

              occurredAt:
                new Date(),
            }),
          ),
        ).resolves.toBeUndefined();
      },
    );
  },
);
