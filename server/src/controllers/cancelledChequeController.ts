import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createCancelledCheque,
  deleteCancelledCheque,
  getCancelledCheque,
  getCancelledCheques,
  updateCancelledCheque,
} from "../services/cancelledChequeService.js";
import { sendSuccess } from "../utils/response.js";

function cancelledChequeId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const cancelledChequeController = {
  getCancelledCheques: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Cancelled cheques fetched successfully.", {
      items: await getCancelledCheques(),
    }),

  getCancelledCheque: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cancelled cheque fetched successfully.",
      await getCancelledCheque(cancelledChequeId(request)),
    ),

  createCancelledCheque: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Cancelled cheque recorded successfully.",
      await createCancelledCheque((request.body ?? {}) as Record<string, unknown>),
    ),

  updateCancelledCheque: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cancelled cheque updated successfully.",
      await updateCancelledCheque(
        cancelledChequeId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteCancelledCheque: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cancelled cheque deleted successfully.",
      await deleteCancelledCheque(cancelledChequeId(request)),
    ),
};