import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";

import { webhookRouter } from "./routes/webhook.routes";
import { AppError } from "./utils/http-errors";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  app.use(cors());
  app.use(express.json({ limit: "200kb" }));
  app.use(morgan("combined"));

  app.get("/health", (_request, response) => {
    response.status(200).send("ok");
  });

  app.use("/webhook", webhookRouter);

  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    logger.error(error.message, { stack: error.stack });

    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid request payload",
        issues: error.flatten()
      });
      return;
    }

    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        message: error.message,
        details: error.details
      });
      return;
    }

    response.status(500).json({
      message: "Internal server error"
    });
  });

  return app;
}
