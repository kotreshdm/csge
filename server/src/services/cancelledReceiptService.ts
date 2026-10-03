import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type CancelledReceiptInput = Record<string, unknown>;

function parseId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid cancelled receipt ID.");
  }
  return BigInt(id);
}

function cancelledReceiptData(input: CancelledReceiptInput) {
  const receiptNo = requiredString(input.receiptNo, "Receipt number");
  if (!/^\d+$/.test(receiptNo)) {
    throw new AppError(400, "Receipt number must contain digits only.");
  }

  return {
    receiptNo,
    cancelledDate: requiredDate(input.cancelledDate, "Cancelled date"),
    reason: optionalString(input.reason, "Reason"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

function handleCancelledReceiptError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        409,
        "This receipt number is already recorded as cancelled.",
      );
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Cancelled receipt not found.");
    }
  }
  throw error;
}

export async function getCancelledReceipts() {
  const receipts = await prisma.cancelledReceipt.findMany({
    orderBy: [{ cancelledDate: "desc" }, { id: "desc" }],
  });
  return receipts.map((receipt) => ({ ...receipt, id: receipt.id.toString() }));
}

export async function getCancelledReceipt(id: string) {
  const receipt = await prisma.cancelledReceipt.findUnique({
    where: { id: parseId(id) },
  });
  if (!receipt) throw new AppError(404, "Cancelled receipt not found.");
  return { ...receipt, id: receipt.id.toString() };
}

export async function createCancelledReceipt(input: CancelledReceiptInput) {
  const data = cancelledReceiptData(input);
  try {
    const receipt = await prisma.cancelledReceipt.create({ data });
    return { ...receipt, id: receipt.id.toString() };
  } catch (error) {
    handleCancelledReceiptError(error);
  }
}

export async function updateCancelledReceipt(
  id: string,
  input: CancelledReceiptInput,
) {
  const data = cancelledReceiptData(input);
  try {
    const receipt = await prisma.cancelledReceipt.update({
      where: { id: parseId(id) },
      data,
    });
    return { ...receipt, id: receipt.id.toString() };
  } catch (error) {
    handleCancelledReceiptError(error);
  }
}

export async function deleteCancelledReceipt(id: string) {
  try {
    const receipt = await prisma.cancelledReceipt.delete({
      where: { id: parseId(id) },
      select: { id: true },
    });
    return { id: receipt.id.toString() };
  } catch (error) {
    handleCancelledReceiptError(error);
  }
}
