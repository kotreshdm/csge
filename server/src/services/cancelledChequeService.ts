import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { optionalString, requiredDate, requiredString } from "../utils/validation.js";

type CancelledChequeInput = Record<string, unknown>;
type CancelledChequeWithAccount = Prisma.CancelledChequeGetPayload<{
  include: { account: { select: { id: true; accountCode: true; name: true } } };
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

  const accountIdText = requiredString(input.accountId, "Account");
  if (!/^\d+$/.test(accountIdText) || BigInt(accountIdText) <= 0n) {
    throw new AppError(400, "Account must be a valid ID.");
  }

  return {
    accountId: BigInt(accountIdText),
    chequeNo,
    cancelledDate: requiredDate(input.cancelledDate, "Cancelled date"),
    reason: optionalString(input.reason, "Reason"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function serializeCancelledCheque(cheque: CancelledChequeWithAccount) {
  return {
    ...cheque,
    id: cheque.id.toString(),
    accountId: cheque.accountId.toString(),
    account: { ...cheque.account, id: cheque.account.id.toString() },
  };
}

function handleCancelledChequeError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(409, "This cheque is already recorded as cancelled for the account.");
    }
    if (error.code === "P2003") {
      throw new AppError(400, "The selected account does not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Cancelled cheque not found.");
    }
  }
  throw error;
}

const includeAccount = {
  account: { select: { id: true, accountCode: true, name: true } },
} satisfies Prisma.CancelledChequeInclude;

export async function getCancelledCheques() {
  const cheques = await prisma.cancelledCheque.findMany({
    include: includeAccount,
    orderBy: [{ cancelledDate: "desc" }, { id: "desc" }],
  });
  return cheques.map(serializeCancelledCheque);
}

export async function getCancelledCheque(id: string) {
  const cheque = await prisma.cancelledCheque.findUnique({
    where: { id: parseId(id) },
    include: includeAccount,
  });
  if (!cheque) throw new AppError(404, "Cancelled cheque not found.");
  return serializeCancelledCheque(cheque);
}

export async function createCancelledCheque(input: CancelledChequeInput) {
  const data = cancelledChequeData(input);
  try {
    return serializeCancelledCheque(
      await prisma.cancelledCheque.create({ data, include: includeAccount }),
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
        include: includeAccount,
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