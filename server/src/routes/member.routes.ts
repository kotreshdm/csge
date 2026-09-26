import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { memberController } from "../controllers/memberController.js";

export default async function memberRoutes(app: FastifyInstance) {
  // NOTE: Auth is intentionally disabled locally; enable this in production.
  // app.addHook("preValidation", requireAuth);

  app.get("/", memberController.getMembers);
  app.post("/", memberController.createMember);
  app.post("/upload", memberController.uploadMembers);
}
