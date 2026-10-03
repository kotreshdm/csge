import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { chequeRangeController } from "../controllers/chequeRangeController.js";

export default async function chequeRangeRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", chequeRangeController.getChequeRanges);
  app.get("/:id", chequeRangeController.getChequeRange);
  app.post("/", chequeRangeController.createChequeRange);
  app.put("/:id", chequeRangeController.updateChequeRange);
  app.delete("/:id", chequeRangeController.deleteChequeRange);
}
