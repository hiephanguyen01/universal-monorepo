import {
  describe,
  expect,
  it,
} from "vitest";

import {
  UserRegisteredEvent,
} from "../src/modules/users/domain/events/user-registered.event";

describe(
  "UserRegisteredEvent",
  () => {
    it(
      "captures registration data",
      () => {
        const now =
          new Date(
            "2026-10-05T10:00:00.000Z",
          );

        const event =
          new UserRegisteredEvent({
            userId:
              "user-1",

            email:
              "alice@example.com",

            occurredAt:
              now,
          });

        expect(
          event,
        ).toMatchObject({
          eventName:
            UserRegisteredEvent
              .eventName,

          userId:
            "user-1",

          email:
            "alice@example.com",

          occurredAt:
            now,
        });

        expect(
          event.toPrimitives(),
        ).toEqual({
          userId:
            "user-1",

          email:
            "alice@example.com",
        });

        expect(
          UserRegisteredEvent
            .fromPrimitives(
              event.toPrimitives(),
              now,
            ),
        ).toMatchObject({
          userId:
            "user-1",

          email:
            "alice@example.com",

          occurredAt:
            now,
        });
      },
    );
  },
);
