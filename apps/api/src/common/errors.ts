export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: unknown = null,
  ) {
    super(message);
  }
}
export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}
