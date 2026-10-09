import { randomUUID } from "node:crypto";
import {
  MemberStatus,
  PaymentMode,
  Prisma,
  TransactionType,
} from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type TransactionInput = Record<string, unknown>;

function formatDateInput(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
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
  "membershipFeeAmount",
  "siteDepositAmount",
  "welfareFundAmount",
  "booksFormsAmount",
  "miscellaneousAmount",
  "otherAmount",
] as const;

function transactionConfig(type: TransactionType, subType: string) {
  const subtype = subType
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (subtype === "SHARE" || subtype === "SHARE_WITHDRAWAL") {
    return {
      member: true,
      party: false,
      requiredParty: false,
      layout: false,
      amounts:
        type === "CREDIT" && subtype === "SHARE"
          ? ([
              "shareAmount",
              "shareFeeAmount",
              "membershipFeeAmount",
              "welfareFundAmount",
              "booksFormsAmount",
              "miscellaneousAmount",
              "otherAmount",
            ] as const)
          : (["shareAmount"] as const),
    };
  }
  if (["SITE", "SITE_DEPOSIT", "LAYOUT", "LAYOUT_TRANSFER"].includes(subtype)) {
    return {
      member: true,
      party: false,
      requiredParty: false,
      layout: true,
      amounts: ["siteDepositAmount"] as const,
    };
  }
  if (subtype === "ADVANCE") {
    return {
      member: false,
      party: true,
      requiredParty: true,
      layout: true,
      amounts: ["otherAmount"] as const,
    };
  }
  if (subtype === "BANK") {
    return {
      member: false,
      party: true,
      requiredParty: true,
      layout: false,
      amounts: ["otherAmount"] as const,
    };
  }
  return {
    member: false,
    party: true,
    requiredParty: false,
    layout: false,
    amounts: ["otherAmount"] as const,
  };
}

function isShareBalanceTransaction(transaction: {
  type: TransactionType;
  subType: string;
  memberId: bigint | null;
}) {
  const subtype = transaction.subType
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return (
    transaction.memberId !== null &&
    (transaction.type === "CREDIT" || transaction.type === "DEBIT") &&
    (subtype === "SHARE" || subtype === "SHARE_WITHDRAWAL")
  );
}

async function synchronizeMemberShareStatus(
  tx: Prisma.TransactionClient,
  memberIds: Iterable<bigint>,
) {
  for (const memberId of new Set(memberIds)) {
    const transactions = await tx.transaction.findMany({
      where: { memberId },
      select: { type: true, subType: true, shareAmount: true },
    });
    const balance = transactions.reduce((total, transaction) => {
      if (!isShareBalanceTransaction({ ...transaction, memberId })) {
        return total;
      }
      return transaction.type === "CREDIT"
        ? total.plus(transaction.shareAmount)
        : total.minus(transaction.shareAmount);
    }, new Prisma.Decimal(0));

    await tx.member.update({
      where: { memberId },
      data: {
        status: balance.greaterThan(0)
          ? MemberStatus.ACTIVE
          : MemberStatus.INACTIVE,
      },
    });
  }
}

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
  const config = transactionConfig(type, subType);
  const activeAmountFields = new Set<string>(config.amounts);
  const amounts = Object.fromEntries(
    amountFields.map((field) => [
      field,
      amount(activeAmountFields.has(field) ? input[field] : "0", field),
    ]),
  ) as Record<(typeof amountFields)[number], Prisma.Decimal>;
  const calculatedTotal = config.amounts.reduce(
    (total, field) => total.plus(amounts[field]),
    new Prisma.Decimal(0),
  );
  if (!calculatedTotal.greaterThan(0)) {
    throw new AppError(400, "Total amount must be greater than zero.");
  }
  const suppliedTotal = amount(input.totalAmount, "Total amount");
  if (!calculatedTotal.equals(suppliedTotal)) {
    throw new AppError(
      400,
      "Total amount must equal the sum of all amount fields.",
    );
  }

  const memberId = config.member ? parseId(input.memberId, "Member ID") : null;
  if (config.member && memberId === null) {
    throw new AppError(400, "Member ID is required for this transaction.");
  }
  const partyId = config.party ? parseId(input.partyId, "Party ID") : null;
  if (config.requiredParty && partyId === null) {
    throw new AppError(400, "Party ID is required for this transaction.");
  }
  const layoutId = config.layout ? parseId(input.layoutId, "Layout ID") : null;
  if (config.layout && layoutId === null) {
    throw new AppError(400, "Layout ID is required for this transaction.");
  }

  const paymentMode = optionalEnum<PaymentMode>(
    input.paymentMode,
    "Payment mode",
    paymentModes,
  );
  const chequeNo =
    paymentMode === "CHEQUE"
      ? optionalString(input.chequeNo, "Cheque number")
      : null;
  const chequeDate =
    paymentMode === "CHEQUE"
      ? optionalDate(input.chequeDate, "Cheque date")
      : null;
  const bankReferenceNo =
    paymentMode === "BANK_TRANSFER"
      ? optionalString(input.bankReferenceNo, "Bank reference number")
      : null;
  if (paymentMode === "CHEQUE" && (!chequeNo || !chequeDate)) {
    throw new AppError(
      400,
      "Cheque number and date are required for cheque payment.",
    );
  }
  if (paymentMode === "BANK_TRANSFER" && !bankReferenceNo) {
    throw new AppError(400, "Bank reference is required for bank transfer.");
  }

  return {
    transactionDate: requiredDate(input.transactionDate, "Transaction date"),
    cashbookNo: optionalInteger(input.cashbookNo, "Cashbook number"),
    cashbookPage: optionalInteger(input.cashbookPage, "Cashbook page"),
    type,
    subType,
    memberId,
    partyId,
    layoutId,
    ...amounts,
    totalAmount: calculatedTotal,
    receiptNo: optionalString(input.receiptNo, "Receipt number"),
    paymentMode,
    chequeNo,
    chequeDate,
    bankReferenceNo,
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
    transactionDate: formatDateInput(transaction.transactionDate),
    chequeDate: transaction.chequeDate
      ? formatDateInput(transaction.chequeDate)
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

async function validateMemberJoinDate(
  memberId: bigint | null,
  transactionDate: Date,
) {
  if (memberId === null) return;

  const member = await prisma.member.findUnique({
    where: { memberId },
    select: { joinDate: true },
  });
  if (!member?.joinDate) {
    throw new AppError(400, "The selected member has no joining date.");
  }

  const joiningDate = member.joinDate.toISOString().slice(0, 10);
  const transactionDay = transactionDate.toISOString().slice(0, 10);
  if (joiningDate > transactionDay) {
    throw new AppError(
      400,
      `Member joined on ${joiningDate}, after transaction date ${transactionDay}.`,
    );
  }
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
  await validateMemberJoinDate(data.memberId, data.transactionDate);
  const createdBy = parseId(input.createdBy, "Created by member ID");

  try {
    const created = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { ...data, transactionNo: `TXN-${randomUUID()}`, createdBy },
        include: transactionRelations,
      });
      if (isShareBalanceTransaction(transaction)) {
        await synchronizeMemberShareStatus(tx, [transaction.memberId!]);
      }
      return transaction;
    });
    return serializeTransaction(created);
  } catch (error) {
    handleTransactionError(error);
  }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const data = transactionData(input);
  await validateMemberJoinDate(data.memberId, data.transactionDate);
  const updatedBy = parseId(input.updatedBy, "Updated by member ID");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findUniqueOrThrow({
        where: { id: parseTransactionId(id) },
      });
      const transaction = await tx.transaction.update({
        where: { id: parseTransactionId(id) },
        data: { ...data, updatedBy },
        include: transactionRelations,
      });
      const affectedMembers = [
        ...(isShareBalanceTransaction(previous) ? [previous.memberId!] : []),
        ...(isShareBalanceTransaction(transaction)
          ? [transaction.memberId!]
          : []),
      ];
      await synchronizeMemberShareStatus(tx, affectedMembers);
      return transaction;
    });
    return serializeTransaction(updated);
  } catch (error) {
    handleTransactionError(error);
  }
}

export async function deleteTransaction(id: string) {
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findUniqueOrThrow({
        where: { id: parseTransactionId(id) },
      });
      const deleted = await tx.transaction.delete({
        where: { id: previous.id },
        select: { id: true },
      });
      if (isShareBalanceTransaction(previous)) {
        await synchronizeMemberShareStatus(tx, [previous.memberId!]);
      }
      return deleted;
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
