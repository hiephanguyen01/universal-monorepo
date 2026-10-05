import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

import { DomainError } from "./domain/domain-error";

import { AppError } from "./errors";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception instanceof DomainError) {
      return res.status(422).json({
        success: false,

        error: {
          code: exception.code,

          message: exception.message,

          details: null,
        },
      });
    }

    if (exception instanceof AppError) {
      return res.status(exception.status).json({
        success: false,

        error: {
          code: exception.code,

          message: exception.message,

          details: exception.details,
        },
      });
    }

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        success: false,

        error: {
          code: "HTTP_ERROR",

          message: exception.message,

          details: exception.getResponse(),
        },
      });
    }

    console.error(exception);

    return res.status(500).json({
      success: false,

      error: {
        code: "INTERNAL_ERROR",

        message: "Internal server error",

        details: null,
      },
    });
  }
}
