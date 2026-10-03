import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createDirector,
  deleteDirector,
  getDirector,
  getDirectors,
  updateDirector,
} from "../services/directorService.js";
import { sendSuccess } from "../utils/response.js";

function directorId(request: FastifyRequest) {
  return String((request.params as { id?: string }).id ?? "");
}

export const directorController = {
  getDirectors: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Directors fetched successfully.", {
      items: await getDirectors(),
    }),

  getDirector: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Director fetched successfully.",
      await getDirector(directorId(request)),
    ),

  createDirector: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      201,
      "Director created successfully.",
      await createDirector((request.body ?? {}) as Record<string, unknown>),
    ),

  updateDirector: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Director updated successfully.",
      await updateDirector(
        directorId(request),
        (request.body ?? {}) as Record<string, unknown>,
      ),
    ),

  deleteDirector: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Director deleted successfully.",
      await deleteDirector(directorId(request)),
    ),
};
