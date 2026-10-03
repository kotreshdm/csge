import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { directorController } from "../controllers/directorController.js";

export default async function directorRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", directorController.getDirectors);
  app.get("/:id", directorController.getDirector);
  app.post("/", directorController.createDirector);
  app.put("/:id", directorController.updateDirector);
  app.delete("/:id", directorController.deleteDirector);
}
