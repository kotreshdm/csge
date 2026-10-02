import { PaymentMode, Prisma, TransactionDirection, TransactionType } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type TransactionInput = Record<string, unknown>;

const directions = ["IN", "OUT", "TRANSFER"] as const;
const transactionTypes = [
  "SHARE",
  "LAYOUT",
  "BANK",
  "EXPENSE",
  "INCOME",
  "ADVANCE",
  "ASSET",
  "OTHER",
] as const;
const paymentModes = ["CASH", "CHEQUE", "BANK_TRANSFER", "UPI", "OTHER"] as const;

function parseId(value: unknown, fieldName: string): bigint | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
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

function optionalInt(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError(400, `${fieldName} must be a valid integer.`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < -2147483648 || parsed > 2147483647) {
    throw new AppError(400, `${fieldName} must be a valid integer.`);
  }
  return parsed;
}

function enumValue<T extends string>(value: unknown, fieldName: string, values: readonly T[]): T {
  if (typeof value === "string" && values.includes(value as T)) return value as T;
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

function amount(value: unknown, fieldName: string, precision: 10 | 15) {
  const rawValue = value ?? "0";
  if (typeof rawValue !== "string" && typeof rawValue !== "number") {
    throw new AppError(400, `${fieldName} must be a valid amount.`);
  }

  let parsed: Prisma.Decimal;
  try {
    parsed = new Prisma.Decimal(rawValue);
  } catch {
    throw new AppError(400, `${fieldName} must be a valid amount.`);
  }

  const maxExclusive = precision === 10 ? "100000000" : "10000000000000";
  if (!parsed.isFinite() || parsed.decimalPlaces() > 2 || parsed.abs().greaterThanOrEqualTo(maxExclusive)) {
    throw new AppError(400, `${fieldName} must fit a ${precision}-digit amount with at most 2 decimals.`);
  }
  return parsed;
}

function transactionData(input: TransactionInput) {
  return {
    cashbookNo: optionalInt(input.cashbookNo, "Cashbook number"),
    cashbookPage: optionalInt(input.cashbookPage, "Cashbook page"),
    transactionDate: requiredDate(input.transactionDate, "Transaction date"),
    direction: enumValue<TransactionDirection>(input.direction, "Direction", directions),
    type: enumValue<TransactionType>(input.type, "Type", transactionTypes),
    subType: requiredString(input.subType, "Sub-type"),
    memberId: parseId(input.memberId, "Member ID"),
    partyId: parseId(input.partyId, "Party ID"),
    layoutId: parseId(input.layoutId, "Layout ID"),
    fromLayoutId: parseId(input.fromLayoutId, "Source layout ID"),
    toLayoutId: parseId(input.toLayoutId, "Destination layout ID"),
    shareAmount: amount(input.shareAmount, "Share amount", 10),
    shareFeeAmount: amount(input.shareFeeAmount, "Share fee amount", 10),
    applicationFeeAmount: amount(input.applicationFeeAmount, "Application fee amount", 10),
    admissionFeeAmount: amount(input.admissionFeeAmount, "Admission fee amount", 10),
    membershipFeeAmount: amount(input.membershipFeeAmount, "Membership fee amount", 10),
    siteDepositAmount: amount(input.siteDepositAmount, "Site deposit amount", 10),
    welfareFundAmount: amount(input.welfareFundAmount, "Welfare fund amount", 10),
    booksFormsAmount: amount(input.booksFormsAmount, "Books/forms amount", 10),
    miscellaneousAmount: amount(input.miscellaneousAmount, "Miscellaneous amount", 10),
    otherAmount: amount(input.otherAmount, "Other amount", 10),
    totalAmount: amount(input.totalAmount, "Total amount", 15),
    fromAccountId: parseId(input.fromAccountId, "Source account ID"),
    toAccountId: parseId(input.toAccountId, "Destination account ID"),
    receiptNo: optionalString(input.receiptNo, "Receipt number"),
    paymentMode: optionalEnum<PaymentMode>(input.paymentMode, "Payment mode", paymentModes),
    chequeNo: optionalString(input.chequeNo, "Cheque number"),
    chequeDate: optionalDate(input.chequeDate, "Cheque date"),
    bankReferenceNo: optionalString(input.bankReferenceNo, "Bank reference number"),
    referenceTransactionId: parseId(input.referenceTransactionId, "Reference transaction ID"),
    description: optionalString(input.description, "Description"),
    remarks: optionalString(input.remarks, "Remarks"),
  };
}

type TransactionRecord = Prisma.TransactionGetPayload<Record<string, never>>;

function serializeTransaction(transaction: TransactionRecord) {
  return {
    ...transaction,
    id: transaction.id.toString(),
    memberId: transaction.memberId?.toString() ?? null,
    partyId: transaction.partyId?.toString() ?? null,
    layoutId: transaction.layoutId?.toString() ?? null,
    fromLayoutId: transaction.fromLayoutId?.toString() ?? null,
    toLayoutId: transaction.toLayoutId?.toString() ?? null,
    fromAccountId: transaction.fromAccountId?.toString() ?? null,
    toAccountId: transaction.toAccountId?.toString() ?? null,
    referenceTransactionId: transaction.referenceTransactionId?.toString() ?? null,
    createdBy: transaction.createdBy.toString(),
    updatedBy: transaction.updatedBy?.toString() ?? null,
    shareAmount: transaction.shareAmount.toString(),
    shareFeeAmount: transaction.shareFeeAmount.toString(),
    applicationFeeAmount: transaction.applicationFeeAmount.toString(),
    admissionFeeAmount: transaction.admissionFeeAmount.toString(),
    membershipFeeAmount: transaction.membershipFeeAmount.toString(),
    siteDepositAmount: transaction.siteDepositAmount.toString(),
    welfareFundAmount: transaction.welfareFundAmount.toString(),
    booksFormsAmount: transaction.booksFormsAmount.toString(),
    miscellaneousAmount: transaction.miscellaneousAmount.toString(),
    otherAmount: transaction.otherAmount.toString(),
    totalAmount: transaction.totalAmount.toString(),
  };
}

function handleTransactionError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(409, "A transaction with these details already exists.");
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
  if (transactionId === null) throw new AppError(400, "Invalid transaction ID.");
  return transactionId;
}

export async function getTransactions() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
  });
  return transactions.map(serializeTransaction);
}

export async function getTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseTransactionId(id) },
  });
  if (!transaction) throw new AppError(404, "Transaction not found.");
  return serializeTransaction(transaction);
}

export async function createTransaction(input: TransactionInput) {
  const data = transactionData(input);
  const createdBy = requiredId(input.createdBy, "Created by member ID");

  try {
    return serializeTransaction(await prisma.transaction.create({
      data: { ...data, createdBy },
    }));
  } catch (error) {
    handleTransactionError(error);
  }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const data = transactionData(input);
  const updatedBy = parseId(input.updatedBy, "Updated by member ID");

  try {
    return serializeTransaction(await prisma.transaction.update({
      where: { id: parseTransactionId(id) },
      data: { ...data, updatedBy },
    }));
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
      throw new AppError(409, "This transaction is referenced by another transaction and cannot be deleted.");
    }
    handleTransactionError(error);
  }
}