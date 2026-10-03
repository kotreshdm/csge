import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createCancelledReceipt,
  deleteCancelledReceipt,
  getCancelledReceipt,
  getCancelledReceipts,
  updateCancelledReceipt,
} from "../services/cancelledReceiptService.js";
import { sendSuccess } from "../utils/response.js";

function cancelledReceiptId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const cancelledReceiptController = {
  getCancelledReceipts: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Cancelled receipts fetched successfully.", {
      items: await getCancelledReceipts(),
    }),

  getCancelledReceipt: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Cancelled receipt fetched successfully.",
      await getCancelledReceipt(cancelledReceiptId(request)),
    ),

  createCancelledReceipt: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) =>
    sendSuccess(
      reply,
      201,
      "Cancelled receipt created successfully.",
      await createCancelledReceipt(
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  updateCancelledReceipt: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) =>
    sendSuccess(
      reply,
      200,
      "Cancelled receipt updated successfully.",
      await updateCancelledReceipt(
        cancelledReceiptId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteCancelledReceipt: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) =>
    sendSuccess(
      reply,
      200,
      "Cancelled receipt deleted successfully.",
      await deleteCancelledReceipt(cancelledReceiptId(request)),
    ),
};
