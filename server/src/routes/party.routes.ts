import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { partyController } from "../controllers/partyController.js";

export default async function partyRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", partyController.getParties);
  app.post("/", partyController.createParty);
  app.put("/:id", partyController.updateParty);
  app.delete("/:id", partyController.deleteParty);
}