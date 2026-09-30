import type { FastifyInstance } from "fastify";

import { requireAuth } from "../middleware/authGuard.js";
import { layoutController } from "../controllers/layoutController.js";

export default async function layoutRoutes(app: FastifyInstance) {
  app.addHook("preValidation", requireAuth);

  app.get("/", layoutController.getLayouts);
  app.get("/:id", layoutController.getLayout);
  app.post("/", layoutController.createLayout);
  app.put("/:id", layoutController.updateLayout);
  app.delete("/:id", layoutController.deleteLayout);
  app.post("/:layoutId/prices", layoutController.createPrice);
  app.put("/:layoutId/prices/:priceId", layoutController.updatePrice);
  app.delete("/:layoutId/prices/:priceId", layoutController.deletePrice);
}
