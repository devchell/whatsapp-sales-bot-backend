import { env } from "./config/env";
import { prisma } from "./database/prisma/client";
import { createApp } from "./app";
import { logger } from "./utils/logger";

async function bootstrap() {
  const app = createApp();

  await prisma.$connect();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  logger.error("Failed to bootstrap application", { error });
  await prisma.$disconnect();
  process.exit(1);
});
