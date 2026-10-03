import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createChequeRange,
  deleteChequeRange,
  getChequeRange,
  getChequeRanges,
  updateChequeRange,
} from "../services/chequeRangeService.js";
import { sendSuccess } from "../utils/response.js";

function chequeRangeId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const chequeRangeController = {
  getChequeRanges: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Cheque ranges fetched successfully.", {
      items: await getChequeRanges(),
    }),

  getChequeRange: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cheque range fetched successfully.",
      await getChequeRange(chequeRangeId(request)),
    ),

  createChequeRange: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Cheque range created successfully.",
      await createChequeRange((request.body ?? {}) as Record<string, unknown>),
    ),

  updateChequeRange: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cheque range updated successfully.",
      await updateChequeRange(
        chequeRangeId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteChequeRange: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cheque range deleted successfully.",
      await deleteChequeRange(chequeRangeId(request)),
    ),
};
