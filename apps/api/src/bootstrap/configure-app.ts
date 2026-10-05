import {
  type INestApplication,
  ValidationPipe,
} from "@nestjs/common";

import helmet from "helmet";

import {
  ApiResponseInterceptor,
} from "@/common/api-response.interceptor";

import {
  AppExceptionFilter,
} from "@/common/app-exception.filter";

import {
  env,
} from "@/config/env";

export function configureApp(
  app: INestApplication,
): void {
  app.setGlobalPrefix(
    "api/v1",
  );

  app.use(
    helmet(),
  );

  app.enableCors({
    origin:
      env.WEB_ORIGIN,

    credentials:
      true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:
        true,

      forbidNonWhitelisted:
        true,

      transform:
        true,
    }),
  );

  app.useGlobalFilters(
    new AppExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new ApiResponseInterceptor(),
  );
}
