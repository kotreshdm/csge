import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";

interface RegisterBody {
  memberCode: string;
  name: string;
  mobile: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

interface LoginBody {
  memberCode: string;
  password: string;
}

export default async function authRoutes(app: FastifyInstance) {
  // Register
  app.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { memberCode, name, mobile, email, password, confirmPassword } =
      request.body;

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

    const passwordHash = await bcrypt.hash(password, 12);

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

  // Login
  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { memberCode, password } = request.body;

    if (!memberCode || !password) {
      return reply.code(400).send({
        success: false,
        message: "Member code and password are required.",
      });
    }

    const member = await prisma.member.findUnique({
      where: {
        memberCode,
        memberType: "SUPERUSER",
      },
    });

    if (!member || !member.passwordHash) {
      return reply.code(401).send({
        success: false,
        message: "Invalid member code or password.",
      });
    }

    if (member.status !== "ACTIVE") {
      return reply.code(403).send({
        success: false,
        message: "Your account is not active.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, member.passwordHash);

    if (!isPasswordValid) {
      return reply.code(401).send({
        success: false,
        message: "Invalid member code or password.",
      });
    }

    const token = app.jwt.sign(
      {
        memberId: member.memberId.toString(),
        memberCode: member.memberCode,
        memberType: member.memberType,
      },
      {
        expiresIn: "1d",
      },
    );

    return reply.code(200).send({
      success: true,
      message: "Login successful.",
      data: {
        token,
        member: {
          memberId: member.memberId.toString(),
          memberCode: member.memberCode,
          name: member.name,
          memberType: member.memberType,
        },
      },
    });
  });
}
