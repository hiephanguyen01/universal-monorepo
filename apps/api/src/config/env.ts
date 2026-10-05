import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(
    __dirname,
    "../../../../.env",
  ),
});

dotenv.config({
  path: path.resolve(
    __dirname,
    "../../.env",
  ),
});

dotenv.config();

const schema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default(
      "development",
    ),

  DATABASE_URL:
    z.string().min(1),

  API_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3001),

  JWT_ACCESS_SECRET:
    z.string().min(16),

  JWT_REFRESH_SECRET:
    z.string().min(16),

  JWT_ACCESS_EXPIRES_IN:
    z.string().default(
      "15m",
    ),

  JWT_REFRESH_EXPIRES_IN:
    z.string().default(
      "30d",
    ),

  WEB_ORIGIN:
    z.string()
      .url()
      .default(
        "http://localhost:3000",
      ),
});

export type Env =
  z.infer<typeof schema>;

export const env =
  schema.parse(
    process.env,
  );
