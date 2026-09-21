import type { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      success: true,
      message: "C S G E API is running",
    };
  });
}
