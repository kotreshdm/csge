import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { memberController } from "../controllers/memberController.js";

export default async function memberRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/address-history", memberController.getAddressHistory);
  app.get("/balances", memberController.getBalances);
  app.get("/:id/transactions", memberController.getTransactions);
  app.get("/", memberController.getMembers);
  app.post("/", memberController.createMember);
  app.put("/:id", memberController.updateMember);
  app.post("/upload", memberController.uploadMembers);
}
