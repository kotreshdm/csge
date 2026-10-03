import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createGbmLetterReturn,
  deleteGbmLetterReturn,
  getGbmLetterReturn,
  getGbmLetterReturns,
  updateGbmLetterReturn,
} from "../services/gbmLetterReturnService.js";
import { sendSuccess } from "../utils/response.js";

function recordId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const gbmLetterReturnController = {
  getGbmLetterReturns: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "GBM letter returns fetched successfully.", {
      items: await getGbmLetterReturns(),
    }),

  getGbmLetterReturn: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "GBM letter return fetched successfully.",
      await getGbmLetterReturn(recordId(request)),
    ),

  createGbmLetterReturn: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "GBM letter return created successfully.",
      await createGbmLetterReturn(
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  updateGbmLetterReturn: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "GBM letter return updated successfully.",
      await updateGbmLetterReturn(
        recordId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteGbmLetterReturn: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "GBM letter return deleted successfully.",
      await deleteGbmLetterReturn(recordId(request)),
    ),
};
