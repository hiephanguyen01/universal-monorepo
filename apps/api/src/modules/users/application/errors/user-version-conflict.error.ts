export class UserVersionConflictError extends Error {
  constructor() {
    super("User was modified by another request");

    this.name = "UserVersionConflictError";
  }
}
