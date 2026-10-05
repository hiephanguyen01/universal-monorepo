import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  env,
} from "@/config/env";

import {
  PrismaClient,
} from "@/generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements
    OnModuleInit,
    OnModuleDestroy
{
  constructor() {
    const adapter =
      new PrismaPg({
        connectionString:
          env.DATABASE_URL,
      });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
