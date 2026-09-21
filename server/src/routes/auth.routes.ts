import type { FastifyInstance } from "fastify";
import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";

interface RegisterBody {
  memberCode: string;
  name: string;
  mobile: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { memberCode, name, mobile, email, password, confirmPassword } =
      request.body;

    // Basic validation
    if (!memberCode || !name || !mobile || !password || !confirmPassword) {
      return reply.code(400).send({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    if (password !== confirmPassword) {
      return reply.code(400).send({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // Check existing member
    const existingMember = await prisma.member.findUnique({
      where: {
        memberCode,
      },
    });

    if (existingMember) {
      return reply.code(409).send({
        success: false,
        message: "Member code already exists.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create member
    const member = await prisma.member.create({
      data: {
        memberCode,
        name,
        mobile,
        email: email || null,
        passwordHash,
      },
    });

    return reply.code(201).send({
      success: true,
      message: "Account created successfully.",
      data: {
        memberId: member.memberId.toString(),
        memberCode: member.memberCode,
        name: member.name,
      },
    });
  });
}
