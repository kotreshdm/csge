import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { optionalString, requiredDate, requiredString } from "../utils/validation.js";

type CancelledChequeInput = Record<string, unknown>;
type CancelledChequeWithParty = Prisma.CancelledChequeGetPayload<{
  include: { party: { select: { id: true; name: true; partyType: true } } };
}>;

function parseId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid cancelled cheque ID.");
  }
  return BigInt(id);
}

function cancelledChequeData(input: CancelledChequeInput) {
  const chequeNo = requiredString(input.chequeNo, "Cheque number");
  if (!/^\d+$/.test(chequeNo)) {
    throw new AppError(400, "Cheque number must contain digits only.");
  }

  const partyIdText = requiredString(input.partyId, "Party");
  if (!/^\d+$/.test(partyIdText) || BigInt(partyIdText) <= 0n) {
    throw new AppError(400, "Party must be a valid ID.");
  }

  return {
    partyId: BigInt(partyIdText),
    chequeNo,
    cancelledDate: requiredDate(input.cancelledDate, "Cancelled date"),
    reason: optionalString(input.reason, "Reason"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function serializeCancelledCheque(cheque: CancelledChequeWithParty) {
  return {
    ...cheque,
    id: cheque.id.toString(),
    partyId: cheque.partyId.toString(),
    party: { ...cheque.party, id: cheque.party.id.toString() },
  };
}

function handleCancelledChequeError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(409, "This cheque is already recorded as cancelled for the party.");
    }
    if (error.code === "P2003") {
      throw new AppError(400, "The selected party does not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Cancelled cheque not found.");
    }
  }
  throw error;
}

const includeParty = {
  party: { select: { id: true, name: true, partyType: true } },
} satisfies Prisma.CancelledChequeInclude;

export async function getCancelledCheques() {
  const cheques = await prisma.cancelledCheque.findMany({
    include: includeParty,
    orderBy: [{ cancelledDate: "desc" }, { id: "desc" }],
  });
  return cheques.map(serializeCancelledCheque);
}

export async function getCancelledCheque(id: string) {
  const cheque = await prisma.cancelledCheque.findUnique({
    where: { id: parseId(id) },
    include: includeParty,
  });
  if (!cheque) throw new AppError(404, "Cancelled cheque not found.");
  return serializeCancelledCheque(cheque);
}

export async function createCancelledCheque(input: CancelledChequeInput) {
  const data = cancelledChequeData(input);
  try {
    return serializeCancelledCheque(
      await prisma.cancelledCheque.create({ data, include: includeParty }),
    );
  } catch (error) {
    handleCancelledChequeError(error);
  }
}

export async function updateCancelledCheque(id: string, input: CancelledChequeInput) {
  const data = cancelledChequeData(input);
  try {
    return serializeCancelledCheque(
      await prisma.cancelledCheque.update({
        where: { id: parseId(id) },
        data,
        include: includeParty,
      }),
    );
  } catch (error) {
    handleCancelledChequeError(error);
  }
}

export async function deleteCancelledCheque(id: string) {
  try {
    const cheque = await prisma.cancelledCheque.delete({
      where: { id: parseId(id) },
      select: { id: true },
    });
    return { id: cheque.id.toString() };
  } catch (error) {
    handleCancelledChequeError(error);
  }
}