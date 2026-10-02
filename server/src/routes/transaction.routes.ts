import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { transactionController } from "../controllers/transactionController.js";

export default async function transactionRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", transactionController.getTransactions);
  app.get("/:id", transactionController.getTransaction);
  app.post("/", transactionController.createTransaction);
  app.put("/:id", transactionController.updateTransaction);
  app.delete("/:id", transactionController.deleteTransaction);
}
