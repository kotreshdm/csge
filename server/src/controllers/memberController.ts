import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import {
  createMember,
  uploadMembersFromFile,
} from "../services/memberService.js";

export const memberController = {
  createMember: async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = (request.body ?? {}) as Record<string, unknown>;

    const member = await createMember(payload);

    return sendSuccess(reply, 201, "Member created successfully.", member);
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
