import type { FastifyInstance } from "fastify";

import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import memberRoutes from "./member.routes.js";
import partyRoutes from "./party.routes.js";
import layoutRoutes from "./layout.routes.js";
import chequeRangeRoutes from "./chequeRange.routes.js";
import cancelledChequeRoutes from "./cancelledCheque.routes.js";
import cancelledReceiptRoutes from "./cancelledReceipt.routes.js";
import transactionRoutes from "./transaction.routes.js";
import directorRoutes from "./director.routes.js";
import gbmLetterReturnRoutes from "./gbmLetterReturn.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import siteRoutes from "./site.routes.js";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(memberRoutes, { prefix: "/members" });
  await app.register(partyRoutes, { prefix: "/parties" });
  await app.register(layoutRoutes, { prefix: "/layouts" });
  await app.register(siteRoutes, { prefix: "/sites" });
  await app.register(chequeRangeRoutes, { prefix: "/cheque-ranges" });
  await app.register(cancelledChequeRoutes, { prefix: "/cancelled-cheques" });
  await app.register(cancelledReceiptRoutes, { prefix: "/cancelled-receipts" });
  await app.register(transactionRoutes, { prefix: "/transactions" });
  await app.register(directorRoutes, { prefix: "/directors" });
  await app.register(gbmLetterReturnRoutes, { prefix: "/gbm-letter-returns" });
  await app.register(dashboardRoutes, { prefix: "/dashboard" });
}
