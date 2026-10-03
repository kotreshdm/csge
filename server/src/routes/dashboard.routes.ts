import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { dashboardController } from "../controllers/dashboardController.js";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);
  app.get("/financial-years", dashboardController.getFinancialYears);
  app.get("/summary", dashboardController.getSummary);
  app.get("/transactions", dashboardController.getTransactions);
}
