import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getAvailableFinancialYears,
  getFinancialYearTransactions,
  getDashboardSummary,
} from "../services/dashboardService.js";
import { getDashboardPositions } from "../services/dashboardPositionService.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

export const dashboardController = {
  getPositions: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      "Dashboard positions fetched successfully.",
      await getDashboardPositions(),
    ),

  getFinancialYears: async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, "Financial years fetched successfully.", {
      items: await getAvailableFinancialYears(),
    }),

  getSummary: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      financialYear?: string;
      fromDate?: string;
      toDate?: string;
    };
    const stringParam = (key: string) =>
      typeof query[key as keyof typeof query] === "string"
        ? (query[key as keyof typeof query] as string)
        : undefined;
    const financialYear = stringParam("financialYear");
    const fromDate = stringParam("fromDate");
    const toDate = stringParam("toDate");
    if (!financialYear && (!fromDate || !toDate)) {
      throw new AppError(400, "Financial year or both dates are required.");
    }
    return sendSuccess(
      reply,
      200,
      "Dashboard summary fetched successfully.",
      await getDashboardSummary(financialYear, fromDate, toDate),
    );
  },

  getTransactions: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, unknown>;
    const financialYear =
      typeof query.financialYear === "string" ? query.financialYear : undefined;
    const fromDate =
      typeof query.fromDate === "string" ? query.fromDate : undefined;
    const toDate = typeof query.toDate === "string" ? query.toDate : undefined;
    if (!financialYear && (!fromDate || !toDate)) {
      throw new AppError(400, "Financial year or both dates are required.");
    }
    const stringParam = (key: string) =>
      typeof query[key] === "string" ? query[key] : undefined;
    return sendSuccess(
      reply,
      200,
      "Financial-year transactions fetched successfully.",
      await getFinancialYearTransactions({
        financialYear: financialYear ?? "",
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? 25),
        search: stringParam("search"),
        type: stringParam("type"),
        subType: stringParam("subType"),
        direction: stringParam("direction"),
        member: stringParam("member"),
        party: stringParam("party"),
        layout: stringParam("layout"),
        account: stringParam("account"),
        fromDate,
        toDate,
      }),
    );
  },
};
