import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type GbmLetterReturnInput = Record<string, unknown>;
type GbmLetterReturnWithMember = Prisma.GbmLetterReturnGetPayload<{
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
    throw new AppError(400, "Invalid GBM letter return ID.");
  }
  return BigInt(id);
}

function gbmLetterReturnData(input: GbmLetterReturnInput) {
  const memberIdText = requiredString(input.memberId, "Member");
  if (!/^\d+$/.test(memberIdText) || BigInt(memberIdText) <= 0n) {
    throw new AppError(400, "Member must be a valid ID.");
  }

  return {
    memberId: BigInt(memberIdText),
    gbmDate: requiredDate(input.gbmDate, "GBM date"),
    letterDate: optionalDate(input.letterDate, "Letter date"),
    returnDate: requiredDate(input.returnDate, "Return date"),
    returnReason: optionalString(input.returnReason, "Return reason"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function serializeRecord(record: GbmLetterReturnWithMember) {
  return {
    ...record,
    id: record.id.toString(),
    memberId: record.memberId.toString(),
    member: { ...record.member, memberId: record.member.memberId.toString() },
  };
}

function handleRecordError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      throw new AppError(400, "The selected member does not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "GBM letter return not found.");
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
} satisfies Prisma.GbmLetterReturnInclude;

export async function getGbmLetterReturns() {
  const records = await prisma.gbmLetterReturn.findMany({
    include: includeMember,
    orderBy: [{ gbmDate: "desc" }, { id: "desc" }],
  });
  return records.map(serializeRecord);
}

export async function getGbmLetterReturn(id: string) {
  const record = await prisma.gbmLetterReturn.findUnique({
    where: { id: parseId(id) },
    include: includeMember,
  });
  if (!record) throw new AppError(404, "GBM letter return not found.");
  return serializeRecord(record);
}

export async function createGbmLetterReturn(input: GbmLetterReturnInput) {
  const data = gbmLetterReturnData(input);
  try {
    return serializeRecord(
      await prisma.gbmLetterReturn.create({ data, include: includeMember }),
    );
  } catch (error) {
    handleRecordError(error);
  }
}

export async function updateGbmLetterReturn(
  id: string,
  input: GbmLetterReturnInput,
) {
  const data = gbmLetterReturnData(input);
  try {
    return serializeRecord(
      await prisma.gbmLetterReturn.update({
        where: { id: parseId(id) },
        data,
        include: includeMember,
      }),
    );
  } catch (error) {
    handleRecordError(error);
  }
}

export async function deleteGbmLetterReturn(id: string) {
  try {
    const record = await prisma.gbmLetterReturn.delete({
      where: { id: parseId(id) },
      select: { id: true },
    });
    return { id: record.id.toString() };
  } catch (error) {
    handleRecordError(error);
  }
}
