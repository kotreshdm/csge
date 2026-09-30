import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

export async function getParties() {
  const parties = await prisma.party.findMany({
    orderBy: [{ partyType: "asc" }, { name: "asc" }, { id: "asc" }],
  });

  return parties.map((party) => ({ ...party, id: party.id.toString() }));
}

function getPartyData(input: Record<string, unknown>) {
  const name = requiredString(input.name, "Party name");
  const partyType = requiredString(input.partyType, "Party type").toUpperCase();
  const status = optionalString(input.status, "Status") ?? "active";
  const startDate = requiredDate(input.startDate, "Start date");
  const endDate = optionalDate(input.endDate, "End date");

  if (endDate && endDate < startDate) {
    throw new AppError(400, "End date must be on or after the start date.");
  }

  return {
    name,
    partyType,
    status,
    mobile: optionalString(input.mobile, "Mobile"),
    address: optionalString(input.address, "Address"),
    details: optionalString(input.details, "Details"),
    startDate,
    endDate,
  };
}

function parsePartyId(id: string): bigint {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new AppError(400, "Invalid party id.");
  }

  return BigInt(id);
}

function handlePartyConflict(error: unknown, name: string, partyType: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(
      409,
      `A party named '${name}' already exists for party type '${partyType}'.`,
    );
  }

  throw error;
}

export async function createParty(input: Record<string, unknown>) {
  const data = getPartyData(input);

  try {
    const party = await prisma.party.create({
      data,
    });

    return { ...party, id: party.id.toString() };
  } catch (error) {
    handlePartyConflict(error, data.name, data.partyType);
  }
}

export async function updateParty(id: string, input: Record<string, unknown>) {
  const partyId = parsePartyId(id);
  const data = getPartyData(input);
  const existingParty = await prisma.party.findUnique({
    where: { id: partyId },
    select: { id: true },
  });

  if (!existingParty) {
    throw new AppError(404, "Party not found.");
  }

  try {
    const party = await prisma.party.update({
      where: { id: partyId },
      data,
    });

    return { ...party, id: party.id.toString() };
  } catch (error) {
    handlePartyConflict(error, data.name, data.partyType);
  }
}

export async function deleteParty(id: string) {
  const partyId = parsePartyId(id);

  try {
    const party = await prisma.party.delete({
      where: { id: partyId },
      select: { id: true, name: true },
    });

    return { ...party, id: party.id.toString() };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError(404, "Party not found.");
    }

    throw error;
  }
}
