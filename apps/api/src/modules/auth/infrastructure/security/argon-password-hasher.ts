import * as argon2 from "argon2";

import type { PasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";

export class ArgonPasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return argon2.hash(value);
  }

  compare(plainValue: string, hashedValue: string): Promise<boolean> {
    return argon2.verify(hashedValue, plainValue);
  }
}
