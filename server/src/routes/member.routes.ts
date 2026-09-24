import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { memberController } from "../controllers/memberController.js";

export default async function memberRoutes(app: FastifyInstance) {
  app.post(    "/",
    {
      preValidation: requireAuth,
    },
    memberController.createMember,
  );

  app.post(    "/upload",
    {
      preValidation: [requireAuth],
    },
    memberController.uploadMembers,
  );
}
