import { randomUUID } from "node:crypto";
import { PaymentMode, Prisma, TransactionType } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type TransactionInput = Record<string, unknown>;

function formatLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const transactionTypes = ["CREDIT", "DEBIT"] as const;
const paymentModes = [
  "CASH",
  "CHEQUE",
  "BANK_TRANSFER",
  "UPI",
  "OTHER",
] as const;
const amountFields = [
  "shareAmount",
  "shareFeeAmount",
  "applicationFeeAmount",
  "admissionFeeAmount",
  "membershipFeeAmount",
  "siteDepositAmount",
  "welfareFundAmount",
  "booksFormsAmount",
  "miscellaneousAmount",
  "otherAmount",
] as const;

function optionalInteger(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError(400, `${fieldName} must be a positive whole number.`);
  }
  const text = String(value);
  if (!/^\d+$/.test(text)) {
    throw new AppError(400, `${fieldName} must be a positive whole number.`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 2147483647) {
    throw new AppError(400, `${fieldName} must be a positive whole number.`);
  }
  return parsed;
}

const acceptedInputFields = new Set([
  "transactionDate",
  "cashbookNo",
  "cashbookPage",
  "type",
  "subType",
  "memberId",
  "partyId",
  "layoutId",
  ...amountFields,
  "totalAmount",
  "receiptNo",
  "paymentMode",
  "chequeNo",
  "chequeDate",
  "bankReferenceNo",
  "remarks",
  "createdBy",
  "updatedBy",
]);

function parseId(value: unknown, fieldName: string): bigint | null {
  if (value === undefined || value === null || value === "") return null;
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "bigint"
  ) {
    throw new AppError(400, `${fieldName} must be a valid ID.`);
  }

  const text = String(value);
  if (!/^\d+$/.test(text) || BigInt(text) <= 0n) {
    throw new AppError(400, `${fieldName} must be a valid ID.`);
  }
  return BigInt(text);
}

function requiredId(value: unknown, fieldName: string): bigint {
  const id = parseId(value, fieldName);
  if (id === null) throw new AppError(400, `${fieldName} is required.`);
  return id;
}

function enumValue<T extends string>(
  value: unknown,
  fieldName: string,
  values: readonly T[],
): T {
  if (typeof value === "string" && values.includes(value as T))
    return value as T;
  throw new AppError(400, `${fieldName} must be one of: ${values.join(", ")}.`);
}

function optionalEnum<T extends string>(
  value: unknown,
  fieldName: string,
  values: readonly T[],
): T | null {
  if (value === undefined || value === null || value === "") return null;
  return enumValue(value, fieldName, values);
}

function amount(value: unknown, fieldName: string) {
  const rawValue =
    value === undefined || value === null || value === "" ? "0" : value;
  if (typeof rawValue !== "string" && typeof rawValue !== "number") {
    throw new AppError(400, `${fieldName} must be a valid amount.`);
  }

  let parsed: Prisma.Decimal;
  try {
    parsed = new Prisma.Decimal(rawValue);
  } catch {
    throw new AppError(400, `${fieldName} must be a valid amount.`);
  }

  const maxExclusive = "10000000000000";
  if (
    !parsed.isFinite() ||
    parsed.decimalPlaces() > 2 ||
    parsed.isNegative() ||
    parsed.abs().greaterThanOrEqualTo(maxExclusive)
  ) {
    throw new AppError(
      400,
      `${fieldName} must be non-negative and fit a 15-digit amount with at most 2 decimals.`,
    );
  }
  return parsed;
}

function validateInputFields(input: TransactionInput) {
  const unknownFields = Object.keys(input).filter(
    (field) => !acceptedInputFields.has(field),
  );
  if (unknownFields.length) {
    throw new AppError(
      400,
      `Unsupported transaction field: ${unknownFields[0]}.`,
    );
  }
}

function transactionData(input: TransactionInput) {
  validateInputFields(input);
  const type = enumValue<TransactionType>(input.type, "Type", transactionTypes);
  const subType = requiredString(input.subType, "Sub-type");
  const amounts = Object.fromEntries(
    amountFields.map((field) => [field, amount(input[field], field)]),
  ) as Record<(typeof amountFields)[number], Prisma.Decimal>;
  const calculatedTotal = amountFields.reduce(
    (total, field) => total.plus(amounts[field]),
    new Prisma.Decimal(0),
  );
  const suppliedTotal = amount(input.totalAmount, "Total amount");
  if (!calculatedTotal.equals(suppliedTotal)) {
    throw new AppError(
      400,
      "Total amount must equal the sum of all amount fields.",
    );
  }

  return {
    transactionDate: requiredDate(input.transactionDate, "Transaction date"),
    cashbookNo: optionalInteger(input.cashbookNo, "Cashbook number"),
    cashbookPage: optionalInteger(input.cashbookPage, "Cashbook page"),
    type,
    subType,
    memberId: parseId(input.memberId, "Member ID"),
    partyId: parseId(input.partyId, "Party ID"),
    layoutId: parseId(input.layoutId, "Layout ID"),
    ...amounts,
    totalAmount: calculatedTotal,
    receiptNo: optionalString(input.receiptNo, "Receipt number"),
    paymentMode: optionalEnum<PaymentMode>(
      input.paymentMode,
      "Payment mode",
      paymentModes,
    ),
    chequeNo: optionalString(input.chequeNo, "Cheque number"),
    chequeDate: optionalDate(input.chequeDate, "Cheque date"),
    bankReferenceNo: optionalString(
      input.bankReferenceNo,
      "Bank reference number",
    ),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

const transactionRelations = {
  member: { select: { memberId: true, memberCode: true, name: true } },
  party: { select: { id: true, name: true, partyType: true } },
  layout: { select: { id: true, layoutCode: true, name: true } },
} satisfies Prisma.TransactionInclude;

type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionRelations;
}>;

function serializeTransaction(transaction: TransactionRecord) {
  return {
    ...transaction,
    transactionDate: formatLocalDateInput(transaction.transactionDate),
    chequeDate: transaction.chequeDate
      ? formatLocalDateInput(transaction.chequeDate)
      : null,
    id: transaction.id.toString(),
    transactionNo: transaction.transactionNo,
    memberId: transaction.memberId?.toString() ?? null,
    partyId: transaction.partyId?.toString() ?? null,
    layoutId: transaction.layoutId?.toString() ?? null,
    createdBy: transaction.createdBy?.toString() ?? null,
    updatedBy: transaction.updatedBy?.toString() ?? null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    ...Object.fromEntries(
      amountFields.map((field) => [field, transaction[field].toString()]),
    ),
    totalAmount: transaction.totalAmount.toString(),
    member: transaction.member
      ? {
          ...transaction.member,
          memberId: transaction.member.memberId.toString(),
        }
      : null,
    party: transaction.party
      ? { ...transaction.party, id: transaction.party.id.toString() }
      : null,
    layout: transaction.layout
      ? { ...transaction.layout, id: transaction.layout.id.toString() }
      : null,
  };
}

function handleTransactionError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        409,
        "A transaction with these details already exists.",
      );
    }
    if (error.code === "P2003") {
      throw new AppError(400, "One or more referenced records do not exist.");
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Transaction not found.");
    }
  }
  throw error;
}

function parseTransactionId(id: string): bigint {
  const transactionId = parseId(id, "Transaction ID");
  if (transactionId === null)
    throw new AppError(400, "Invalid transaction ID.");
  return transactionId;
}

export async function getTransactions() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    include: transactionRelations,
  });
  return transactions.map(serializeTransaction);
}

export async function getTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseTransactionId(id) },
    include: transactionRelations,
  });
  if (!transaction) throw new AppError(404, "Transaction not found.");
  return serializeTransaction(transaction);
}

export async function createTransaction(input: TransactionInput) {
  const data = transactionData(input);
  const createdBy = parseId(input.createdBy, "Created by member ID");

  try {
    return serializeTransaction(
      await prisma.transaction.create({
        data: { ...data, transactionNo: `TXN-${randomUUID()}`, createdBy },
        include: transactionRelations,
      }),
    );
  } catch (error) {
    handleTransactionError(error);
  }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const data = transactionData(input);
  const updatedBy = parseId(input.updatedBy, "Updated by member ID");

  try {
    return serializeTransaction(
      await prisma.transaction.update({
        where: { id: parseTransactionId(id) },
        data: { ...data, updatedBy },
        include: transactionRelations,
      }),
    );
  } catch (error) {
    handleTransactionError(error);
  }
}

export async function deleteTransaction(id: string) {
  try {
    const transaction = await prisma.transaction.delete({
      where: { id: parseTransactionId(id) },
      select: { id: true },
    });
    return { ...transaction, id: transaction.id.toString() };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new AppError(
        409,
        "This transaction is referenced by another transaction and cannot be deleted.",
      );
    }
    handleTransactionError(error);
  }
}
