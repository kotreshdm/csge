import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  updateAccount,
} from "../services/accountService.js";
import { sendSuccess } from "../utils/response.js";

function accountId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const accountController = {
  getAccounts: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Accounts fetched successfully.", {
      items: await getAccounts(),
    }),

  getAccount: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Account fetched successfully.",
      await getAccount(accountId(request)),
    ),

  createAccount: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Account created successfully.",
      await createAccount((request.body ?? {}) as Record<string, unknown>),
    ),

  updateAccount: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Account updated successfully.",
      await updateAccount(
        accountId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteAccount: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Account deleted successfully.",
      await deleteAccount(accountId(request)),
    ),
};
