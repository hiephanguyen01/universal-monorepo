import {
  NestFactory,
} from "@nestjs/core";

import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";

import "reflect-metadata";

import {
  AppModule,
} from "./app.module";

import {
  configureApp,
} from "./bootstrap/configure-app";

import {
  env,
} from "./config/env";

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
    );

  configureApp(
    app,
  );

  const doc =
    SwaggerModule
      .createDocument(
        app,

        new DocumentBuilder()
          .setTitle(
            "API",
          )
          .setVersion(
            "1",
          )
          .addBearerAuth()
          .build(),
      );

  SwaggerModule.setup(
    "api/docs",
    app,
    doc,
  );

  await app.listen(
    env.API_PORT,
  );
}

void bootstrap();
