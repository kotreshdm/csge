import type { FastifyReply } from "fastify";

export function sendSuccess<T>(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  data?: T,
) {
  return reply.code(statusCode).send({
    success: true,
    message,
    data,
  });
}
