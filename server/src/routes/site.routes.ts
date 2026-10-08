import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { siteController } from "../controllers/siteController.js";

export default async function siteRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);
  app.get("/", siteController.getSites);
  app.post("/", siteController.createSite);
  app.put("/:id", siteController.updateSite);
  app.put("/:id/assignment", siteController.assignSite);
  app.put("/:id/status", siteController.changeSiteStatus);
}
