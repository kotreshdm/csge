import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from "../services/transactionService.js";
import { sendSuccess } from "../utils/response.js";

function transactionId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const transactionController = {
  getTransactions: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Transactions fetched successfully.", {
      items: await getTransactions(),
    }),

  getTransaction: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Transaction fetched successfully.",
      await getTransaction(transactionId(request)),
    ),

  createTransaction: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Transaction created successfully.",
      await createTransaction((request.body ?? {}) as Record<string, unknown>),
    ),

  updateTransaction: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Transaction updated successfully.",
      await updateTransaction(
        transactionId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteTransaction: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Transaction deleted successfully.",
      await deleteTransaction(transactionId(request)),
    ),
};
