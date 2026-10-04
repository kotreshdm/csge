import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type ChequeRangeInput = Record<string, unknown>;
type ChequeRangeWithParty = Prisma.ChequeRangeGetPayload<{
  include: { party: { select: { id: true; name: true; partyType: true } } };
}>;

function parseChequeRangeId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid cheque range ID.");
  }
  return BigInt(id);
}

function chequeRangeData(input: ChequeRangeInput) {
  const startChequeNo = requiredString(
    input.startChequeNo,
    "Starting cheque number",
  );
  const endChequeNo = requiredString(input.endChequeNo, "Ending cheque number");

  if (!/^\d+$/.test(startChequeNo) || !/^\d+$/.test(endChequeNo)) {
    throw new AppError(400, "Cheque numbers must contain digits only.");
  }
  if (BigInt(startChequeNo) > BigInt(endChequeNo)) {
    throw new AppError(
      400,
      "Starting cheque number cannot exceed ending cheque number.",
    );
  }

  const partyIdText = requiredString(input.partyId, "Party");
  if (!/^\d+$/.test(partyIdText) || BigInt(partyIdText) <= 0n) {
    throw new AppError(400, "Party must be a valid ID.");
  }

  return {
    partyId: BigInt(partyIdText),
    startChequeNo,
    endChequeNo,
    receivedDate: requiredDate(input.receivedDate, "Received date"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function serializeChequeRange(range: ChequeRangeWithParty) {
  return {
    ...range,
    id: range.id.toString(),
    partyId: range.partyId.toString(),
    party: { ...range.party, id: range.party.id.toString() },
  };
}

function handleChequeRangeError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      throw new AppError(400, "The selected party does not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Cheque range not found.");
    }
  }
  throw error;
}

const includeParty = {
  party: { select: { id: true, name: true, partyType: true } },
} satisfies Prisma.ChequeRangeInclude;

export async function getChequeRanges() {
  const ranges = await prisma.chequeRange.findMany({
    include: includeParty,
    orderBy: [{ receivedDate: "desc" }, { id: "desc" }],
  });
  return ranges.map(serializeChequeRange);
}

export async function getChequeRange(id: string) {
  const range = await prisma.chequeRange.findUnique({
    where: { id: parseChequeRangeId(id) },
    include: includeParty,
  });
  if (!range) throw new AppError(404, "Cheque range not found.");
  return serializeChequeRange(range);
}

export async function createChequeRange(input: ChequeRangeInput) {
  const data = chequeRangeData(input);
  try {
    return serializeChequeRange(
      await prisma.chequeRange.create({ data, include: includeParty }),
    );
  } catch (error) {
    handleChequeRangeError(error);
  }
}

export async function updateChequeRange(id: string, input: ChequeRangeInput) {
  const data = chequeRangeData(input);
  try {
    return serializeChequeRange(
      await prisma.chequeRange.update({
        where: { id: parseChequeRangeId(id) },
        data,
        include: includeParty,
      }),
    );
  } catch (error) {
    handleChequeRangeError(error);
  }
}

export async function deleteChequeRange(id: string) {
  try {
    const range = await prisma.chequeRange.delete({
      where: { id: parseChequeRangeId(id) },
      select: { id: true },
    });
    return { id: range.id.toString() };
  } catch (error) {
    handleChequeRangeError(error);
  }
}
