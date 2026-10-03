import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type DirectorInput = Record<string, unknown>;
type DirectorWithMember = Prisma.DirectorGetPayload<{
  include: {
    member: {
      select: {
        memberId: true;
        memberCode: true;
        name: true;
        nameKannada: true;
        status: true;
      };
    };
  };
}>;

function parseId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid director ID.");
  }
  return BigInt(id);
}

function directorData(input: DirectorInput) {
  const memberIdText = requiredString(input.memberId, "Member");
  if (!/^\d+$/.test(memberIdText) || BigInt(memberIdText) <= 0n) {
    throw new AppError(400, "Member must be a valid ID.");
  }

  const fromDate = requiredDate(input.fromDate, "Start date");
  const toDate = optionalDate(input.toDate, "End date");
  if (toDate && toDate < fromDate) {
    throw new AppError(400, "End date cannot be earlier than start date.");
  }

  const termText = requiredString(input.term, "Term");
  if (!/^\d+$/.test(termText) || Number(termText) < 1 || !Number.isSafeInteger(Number(termText))) {
    throw new AppError(400, "Term must be a positive whole number.");
  }

  return {
    memberId: BigInt(memberIdText),
    position: requiredString(input.position, "Position"),
    quota: requiredString(input.quota, "Quota"),
    term: Number(termText),
    fromDate,
    toDate,
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function serializeDirector(director: DirectorWithMember) {
  return {
    ...director,
    id: director.id.toString(),
    memberId: director.memberId.toString(),
    member: {
      ...director.member,
      memberId: director.member.memberId.toString(),
    },
  };
}

function handleDirectorError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      throw new AppError(400, "The selected member does not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Director record not found.");
    }
  }
  throw error;
}

const includeMember = {
  member: {
    select: {
      memberId: true,
      memberCode: true,
      name: true,
      nameKannada: true,
      status: true,
    },
  },
} satisfies Prisma.DirectorInclude;

export async function getDirectors() {
  const directors = await prisma.director.findMany({
    include: includeMember,
    orderBy: [{ fromDate: "desc" }, { id: "desc" }],
  });
  return directors.map(serializeDirector);
}

export async function getDirector(id: string) {
  const director = await prisma.director.findUnique({
    where: { id: parseId(id) },
    include: includeMember,
  });
  if (!director) throw new AppError(404, "Director record not found.");
  return serializeDirector(director);
}

export async function createDirector(input: DirectorInput) {
  const data = directorData(input);
  try {
    return serializeDirector(
      await prisma.director.create({ data, include: includeMember }),
    );
  } catch (error) {
    handleDirectorError(error);
  }
}

export async function updateDirector(id: string, input: DirectorInput) {
  const data = directorData(input);
  try {
    return serializeDirector(
      await prisma.director.update({
        where: { id: parseId(id) },
        data,
        include: includeMember,
      }),
    );
  } catch (error) {
    handleDirectorError(error);
  }
}

export async function deleteDirector(id: string) {
  try {
    const director = await prisma.director.delete({
      where: { id: parseId(id) },
      select: { id: true },
    });
    return { id: director.id.toString() };
  } catch (error) {
    handleDirectorError(error);
  }
}
