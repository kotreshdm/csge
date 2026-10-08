import type { FastifyReply, FastifyRequest } from "fastify";

import {
  assignSite,
  changeSiteStatus,
  createSite,
  getSites,
  updateSite,
} from "../services/siteService.js";
import { sendSuccess } from "../utils/response.js";

function siteId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const siteController = {
  getSites: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Sites fetched successfully.", {
      items: await getSites(),
    }),

  createSite: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Site created successfully.",
      await createSite((request.body ?? {}) as Record<string, unknown>),
    ),

  updateSite: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Site updated successfully.",
      await updateSite(
        siteId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  assignSite: async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    return sendSuccess(
      reply,
      200,
      "Site assignment updated successfully.",
      await assignSite(siteId(request), body.memberId),
    );
  },

  changeSiteStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    return sendSuccess(
      reply,
      200,
      "Site status updated successfully.",
      await changeSiteStatus(siteId(request), body.status),
    );
  },
};
