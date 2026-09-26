import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import routes from "./routes/index.js";
import fastifyJwt from "@fastify/jwt";

import { AppError } from "./utils/AppError.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message =
      error instanceof AppError
        ? error.message
        : "Something went wrong. Please try again later.";

    const payload: Record<string, unknown> = {
      success: false,
      message,
    };

    if (error instanceof AppError && error.details !== undefined) {
      payload.details = error.details;
    }

    if (statusCode >= 500) {
      request.log.error({ err: error, req: request }, "Unhandled error");
    }

    reply.code(statusCode).send(payload);
  });

  await app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.register(multipart);

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });
  await app.register(routes, {
    prefix: "/api",
  });

  return app;
};
