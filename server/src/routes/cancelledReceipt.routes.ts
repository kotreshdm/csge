import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { cancelledReceiptController } from "../controllers/cancelledReceiptController.js";

export default async function cancelledReceiptRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", cancelledReceiptController.getCancelledReceipts);
  app.get("/:id", cancelledReceiptController.getCancelledReceipt);
  app.post("/", cancelledReceiptController.createCancelledReceipt);
  app.put("/:id", cancelledReceiptController.updateCancelledReceipt);
  app.delete("/:id", cancelledReceiptController.deleteCancelledReceipt);
}