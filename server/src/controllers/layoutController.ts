import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createLayout,
  createLayoutPrice,
  deleteLayout,
  deleteLayoutPrice,
  getLayout,
  getLayouts,
  updateLayout,
  updateLayoutPrice,
} from "../services/layoutService.js";
import { sendSuccess } from "../utils/response.js";

function routeParams(request: FastifyRequest) {
  return request.params as { id?: string; layoutId?: string; priceId?: string };
}

export const layoutController = {
  getLayouts: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Layouts fetched successfully.", {
      items: await getLayouts(),
    }),

  getLayout: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Layout fetched successfully.",
      await getLayout(routeParams(request).id ?? ""),
    ),

  createLayout: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Layout created successfully.",
      await createLayout((request.body ?? {}) as Record<string, unknown>),
    ),

  updateLayout: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Layout updated successfully.",
      await updateLayout(
        routeParams(request).id ?? "",
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteLayout: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Layout deleted successfully.",
      await deleteLayout(routeParams(request).id ?? ""),
    ),

  createPrice: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = routeParams(request);
    return sendSuccess(
      reply,
      201,
      "Layout price created successfully.",
      await createLayoutPrice(
        params.layoutId ?? "",
        (request.body ?? {}) as Record<string, unknown>,
      ),
    );
  },

  updatePrice: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = routeParams(request);
    return sendSuccess(
      reply,
      200,
      "Layout price updated successfully.",
      await updateLayoutPrice(
        params.layoutId ?? "",
        params.priceId ?? "",
        (request.body ?? {}) as Record<string, unknown>,
      ),
    );
  },

  deletePrice: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = routeParams(request);
    return sendSuccess(
      reply,
      200,
      "Layout price deleted successfully.",
      await deleteLayoutPrice(params.layoutId ?? "", params.priceId ?? ""),
    );
  },
};
