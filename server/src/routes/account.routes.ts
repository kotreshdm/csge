import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { accountController } from "../controllers/accountController.js";

export default async function accountRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", accountController.getAccounts);
  app.get("/:id", accountController.getAccount);
  app.post("/", accountController.createAccount);
  app.put("/:id", accountController.updateAccount);
  app.delete("/:id", accountController.deleteAccount);
}
