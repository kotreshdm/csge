import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { optionalString, requiredString } from "../utils/validation.js";

type AccountInput = Record<string, unknown>;

function parseAccountId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid account ID.");
  }
  return BigInt(id);
}

function accountData(input: AccountInput) {
  const code = requiredString(input.accountCode, "Account code");
  const name = requiredString(input.name, "Account name");
  const accountType = requiredString(input.accountType, "Account type");
  const rawBalance = input.openingBalance ?? "0";

  if (typeof rawBalance !== "string" && typeof rawBalance !== "number") {
    throw new AppError(400, "Opening balance must be a valid amount.");
  }

  let openingBalance: Prisma.Decimal;
  try {
    openingBalance = new Prisma.Decimal(rawBalance);
  } catch {
    throw new AppError(400, "Opening balance must be a valid amount.");
  }
  if (
    !openingBalance.isFinite() ||
    openingBalance.decimalPlaces() > 2 ||
    openingBalance.abs().greaterThanOrEqualTo("10000000000000")
  ) {
    throw new AppError(
      400,
      "Opening balance must fit a 15-digit amount with at most 2 decimals.",
    );
  }

  const isActive = input.isActive === undefined ? true : input.isActive;
  if (typeof isActive !== "boolean") {
    throw new AppError(400, "Active status must be true or false.");
  }

  return {
    accountCode: code,
    name,
    accountType,
    accountNumber: optionalString(input.accountNumber, "Account number"),
    bankName: optionalString(input.bankName, "Bank name"),
    openingBalance,
    isActive,
  };
}

function serializeAccount<
  T extends { id: bigint; openingBalance: Prisma.Decimal },
>(account: T) {
  return {
    ...account,
    id: account.id.toString(),
    openingBalance: account.openingBalance.toString(),
  };
}

function handleAccountError(error: unknown, accountCode?: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        409,
        `An account with code '${accountCode ?? ""}' already exists.`,
      );
    }
    if (error.code === "P2025") {
      throw new AppError(404, "Account not found.");
    }
  }
  throw error;
}

export async function getAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: [{ accountCode: "asc" }, { id: "asc" }],
  });
  return accounts.map(serializeAccount);
}

export async function getAccount(id: string) {
  const account = await prisma.account.findUnique({
    where: { id: parseAccountId(id) },
  });
  if (!account) throw new AppError(404, "Account not found.");
  return serializeAccount(account);
}

export async function createAccount(input: AccountInput) {
  const data = accountData(input);
  try {
    return serializeAccount(await prisma.account.create({ data }));
  } catch (error) {
    handleAccountError(error, data.accountCode);
  }
}

export async function updateAccount(id: string, input: AccountInput) {
  const data = accountData(input);
  try {
    const account = await prisma.account.update({
      where: { id: parseAccountId(id) },
      data,
    });
    return serializeAccount(account);
  } catch (error) {
    handleAccountError(error, data.accountCode);
  }
}

export async function deleteAccount(id: string) {
  try {
    const account = await prisma.account.delete({
      where: { id: parseAccountId(id) },
      select: { id: true, accountCode: true, name: true },
    });
    return { ...account, id: account.id.toString() };
  } catch (error) {
    handleAccountError(error);
  }
}
