import Fastify from "fastify";
import cors from "@fastify/cors";
import routes from "./routes/index.js";
import fastifyJwt from "@fastify/jwt";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: "http://localhost:5173",
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });
  await app.register(routes, {
    prefix: "/api",
  });

  return app;
};
