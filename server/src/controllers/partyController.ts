import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createParty,
  deleteParty,
  getParties,
  updateParty,
} from "../services/partyService.js";
import { sendSuccess } from "../utils/response.js";

export const partyController = {
  getParties: async (_request: FastifyRequest, reply: FastifyReply) => {
    const parties = await getParties();

    return sendSuccess(reply, 200, "Parties fetched successfully.", {
      items: parties,
    });
  },

  createParty: async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = (request.body ?? {}) as Record<string, unknown>;
    const party = await createParty(payload);

    return sendSuccess(reply, 201, "Party created successfully.", party);
  },

  updateParty: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id?: string };
    const payload = (request.body ?? {}) as Record<string, unknown>;
    const party = await updateParty(String(params.id ?? ""), payload);

    return sendSuccess(reply, 200, "Party updated successfully.", party);
  },

  deleteParty: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id?: string };
    const party = await deleteParty(String(params.id ?? ""));

    return sendSuccess(reply, 200, "Party deleted successfully.", party);
  },
};
