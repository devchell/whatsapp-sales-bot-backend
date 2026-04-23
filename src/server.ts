import { env } from "./config/env";
import { prisma } from "./database/prisma/client";
import { createApp } from "./app";
import { logger } from "./utils/logger";

async function bootstrap() {
  const app = createApp();
  const port = Number(process.env.PORT || env.PORT || 3000);

  await prisma.$connect();

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

bootstrap().catch(async (error) => {
  logger.error("Failed to bootstrap application", { error });
  await prisma.$disconnect();
  process.exit(1);
});
