import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { memberController } from "../controllers/memberController.js";

export default async function memberRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", memberController.getMembers);
  app.post("/", memberController.createMember);
  app.post("/upload", memberController.uploadMembers);
}
