import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import {
  createMember,
  getMembers,
  updateMember,
  uploadMembersFromFile,
} from "../services/memberService.js";

export const memberController = {
  getMembers: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    const search = typeof query.search === "string" ? query.search : "";

    const memberType =
      typeof query.memberType === "string" ? query.memberType : "";

    const status = typeof query.status === "string" ? query.status : "";

    const gender = typeof query.gender === "string" ? query.gender : "";

    // NEW
    const sortBy =
      typeof query.sortBy === "string" ? query.sortBy : "memberCode";

    // NEW
    const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

    const result = await getMembers({
      page,
      limit,
      search,
      memberType,
      status,
      gender,

      // NEW
      sortBy,
      sortOrder,
    });

    return sendSuccess(reply, 200, "Members fetched successfully.", result);
  },

  createMember: async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = (request.body ?? {}) as Record<string, unknown>;

    const member = await createMember(payload);

    return sendSuccess(reply, 201, "Member created successfully.", member);
  },

  updateMember: async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id?: string };
    const payload = (request.body ?? {}) as Record<string, unknown>;

    const member = await updateMember(String(params.id ?? ""), payload);

    return sendSuccess(reply, 200, "Member updated successfully.", member);
  },

  uploadMembers: async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();

    if (!file) {
      throw new AppError(400, "No file uploaded.");
    }

    const fileName = file.filename;
    const isValidFile = /\.(xlsx|xls|csv)$/i.test(fileName);

    if (!isValidFile) {
      throw new AppError(400, "Only Excel or CSV files are allowed.");
    }

    const buffer = await file.toBuffer();
    const result = await uploadMembersFromFile(buffer, fileName);
    const hasValidRows = result.createdRows > 0;

    if (!hasValidRows) {
      throw new AppError(400, "No valid member records were created.", result);
    }

    return sendSuccess(
      reply,
      200,
      `Uploaded ${result.createdRows} member record(s).`,
      result,
    );
  },
};
