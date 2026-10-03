import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { gbmLetterReturnController } from "../controllers/gbmLetterReturnController.js";

export default async function gbmLetterReturnRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", gbmLetterReturnController.getGbmLetterReturns);
  app.get("/:id", gbmLetterReturnController.getGbmLetterReturn);
  app.post("/", gbmLetterReturnController.createGbmLetterReturn);
  app.put("/:id", gbmLetterReturnController.updateGbmLetterReturn);
  app.delete("/:id", gbmLetterReturnController.deleteGbmLetterReturn);
}