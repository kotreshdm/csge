import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getAvailableFinancialYears,
  getDashboardSummary,
} from "../services/dashboardService.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

export const dashboardController = {
  getFinancialYears: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Financial years fetched successfully.", {
      items: await getAvailableFinancialYears(),
    }),

  getSummary: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { financialYear?: string };
    if (!query.financialYear)
      throw new AppError(400, "Financial year is required.");
    return sendSuccess(
      reply,
      200,
      "Dashboard summary fetched successfully.",
      await getDashboardSummary(query.financialYear),
    );
  },
};
