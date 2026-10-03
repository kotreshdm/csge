import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { cancelledChequeController } from "../controllers/cancelledChequeController.js";

export default async function cancelledChequeRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", cancelledChequeController.getCancelledCheques);
  app.get("/:id", cancelledChequeController.getCancelledCheque);
  app.post("/", cancelledChequeController.createCancelledCheque);
  app.put("/:id", cancelledChequeController.updateCancelledCheque);
  app.delete("/:id", cancelledChequeController.deleteCancelledCheque);
}