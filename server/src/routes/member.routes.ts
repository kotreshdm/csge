import type { FastifyInstance } from "fastify";

import { memberController } from "../controllers/memberController.js";

export default async function memberRoutes(app: FastifyInstance) {
  app.post("/upload", memberController.uploadMembers);
}
