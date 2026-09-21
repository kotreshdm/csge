import type { FastifyInstance } from "fastify";

import healthRoutes from "./health.routes.js";
// import memberRoutes from "./member.routes.js";
// import layoutRoutes from "./layout.routes.js";
// import developerRoutes from "./developer.routes.js";
// import directorRoutes from "./director.routes.js";
// import transactionRoutes from "./transaction.routes.js";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes);
  // await app.register(memberRoutes, { prefix: "/members" });
  // await app.register(layoutRoutes, { prefix: "/layouts" });
  // await app.register(developerRoutes, { prefix: "/developers" });
  // await app.register(directorRoutes, { prefix: "/directors" });
  // await app.register(transactionRoutes, { prefix: "/transactions" });
}
