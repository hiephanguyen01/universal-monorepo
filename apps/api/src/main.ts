import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { env } from "./config/env";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AppExceptionFilter());
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("API")
      .setVersion("1")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("api/docs", app, doc);
  await app.listen(env.API_PORT);
}
bootstrap();
