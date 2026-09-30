import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredString,
} from "../utils/validation.js";

type Input = Record<string, unknown>;

function parseId(value: string, fieldName: string): bigint {
  if (!/^\d+$/.test(value) || BigInt(value) <= 0n) {
    throw new AppError(400, `Invalid ${fieldName}.`);
  }

  return BigInt(value);
}

function parseDeveloperIds(value: unknown): bigint[] {
  if (value === undefined || value === null || value === "") return [];
  if (!Array.isArray(value))
    throw new AppError(400, "Developer IDs must be a list.");

  return value.map((id) => {
    const text = String(id).trim();
    if (!/^\d+$/.test(text) || BigInt(text) <= 0n) {
      throw new AppError(400, "Developer IDs must be positive whole numbers.");
    }
    return BigInt(text);
  });
}

function layoutData(input: Input) {
  const status = optionalString(input.status, "Status") ?? "active";
  if (!["active", "inactive"].includes(status.toLowerCase())) {
    throw new AppError(400, "Status must be active or inactive.");
  }

  return {
    layoutCode: requiredString(input.layoutCode, "Layout code"),
    name: requiredString(input.name, "Layout name"),
    location: optionalString(input.location, "Location"),
    address: optionalString(input.address, "Address"),
    surveyNumbers: optionalString(input.surveyNumbers, "Survey numbers"),
    developerIds: parseDeveloperIds(input.developerIds),
    description: optionalString(input.description, "Description"),
    otherDetails: optionalString(input.otherDetails, "Other details"),
    status: status.toLowerCase(),
  };
}

function priceData(input: Input) {
  const rawPrice = input.pricePerSqFt;
  if (typeof rawPrice !== "string" && typeof rawPrice !== "number") {
    throw new AppError(400, "Price per square foot is required.");
  }

  let pricePerSqFt: Prisma.Decimal;
  try {
    pricePerSqFt = new Prisma.Decimal(rawPrice);
  } catch {
    throw new AppError(400, "Price per square foot must be a valid amount.");
  }
  if (!pricePerSqFt.isFinite() || pricePerSqFt.lessThanOrEqualTo(0)) {
    throw new AppError(400, "Price per square foot must be greater than zero.");
  }

  const validFrom = requiredDate(input.validFrom, "Valid from");
  const validTo = optionalDate(input.validTo, "Valid to");
  if (validTo && validTo < validFrom) {
    throw new AppError(400, "Valid to must be on or after valid from.");
  }

  return { pricePerSqFt, validFrom, validTo };
}

function serializePrice<
  T extends { id: bigint; layoutId: bigint; pricePerSqFt: Prisma.Decimal },
>(price: T) {
  return {
    ...price,
    id: price.id.toString(),
    layoutId: price.layoutId.toString(),
    pricePerSqFt: price.pricePerSqFt.toString(),
  };
}

function serializeLayout<
  T extends {
    id: bigint;
    developerIds: bigint[];
    prices?: Array<{
      id: bigint;
      layoutId: bigint;
      pricePerSqFt: Prisma.Decimal;
    }>;
  },
>(layout: T) {
  return {
    ...layout,
    id: layout.id.toString(),
    developerIds: layout.developerIds.map(String),
    ...(layout.prices ? { prices: layout.prices.map(serializePrice) } : {}),
  };
}

function handleLayoutConflict(error: unknown, layoutCode: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(
      409,
      `A layout with code '${layoutCode}' already exists.`,
    );
  }
  throw error;
}

export async function getLayouts() {
  const layouts = await prisma.layout.findMany({
    include: { prices: { orderBy: { validFrom: "desc" } } },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return layouts.map(serializeLayout);
}

export async function getLayout(id: string) {
  const layoutId = parseId(id, "layout ID");
  const layout = await prisma.layout.findUnique({
    where: { id: layoutId },
    include: { prices: { orderBy: { validFrom: "desc" } } },
  });
  if (!layout) throw new AppError(404, "Layout not found.");
  return serializeLayout(layout);
}

export async function createLayout(input: Input) {
  const data = layoutData(input);
  try {
    return serializeLayout(await prisma.layout.create({ data }));
  } catch (error) {
    handleLayoutConflict(error, data.layoutCode);
  }
}

export async function updateLayout(id: string, input: Input) {
  const layoutId = parseId(id, "layout ID");
  const data = layoutData(input);
  try {
    return serializeLayout(
      await prisma.layout.update({ where: { id: layoutId }, data }),
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError(404, "Layout not found.");
    }
    handleLayoutConflict(error, data.layoutCode);
  }
}

export async function deleteLayout(id: string) {
  const layoutId = parseId(id, "layout ID");
  try {
    return await prisma.$transaction(async (transaction) => {
      await transaction.layoutPrice.deleteMany({ where: { layoutId } });
      const layout = await transaction.layout.delete({
        where: { id: layoutId },
        select: { id: true, layoutCode: true, name: true },
      });
      return { ...layout, id: layout.id.toString() };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError(404, "Layout not found.");
    }
    throw error;
  }
}

export async function createLayoutPrice(layoutIdValue: string, input: Input) {
  const layoutId = parseId(layoutIdValue, "layout ID");
  if (
    !(await prisma.layout.findUnique({
      where: { id: layoutId },
      select: { id: true },
    }))
  ) {
    throw new AppError(404, "Layout not found.");
  }
  const price = await prisma.layoutPrice.create({
    data: { layoutId, ...priceData(input) },
  });
  return serializePrice(price);
}

export async function updateLayoutPrice(
  layoutIdValue: string,
  priceIdValue: string,
  input: Input,
) {
  const layoutId = parseId(layoutIdValue, "layout ID");
  const priceId = parseId(priceIdValue, "price ID");
  const existing = await prisma.layoutPrice.findFirst({
    where: { id: priceId, layoutId },
    select: { id: true },
  });
  if (!existing) throw new AppError(404, "Layout price not found.");
  const price = await prisma.layoutPrice.update({
    where: { id: priceId },
    data: priceData(input),
  });
  return serializePrice(price);
}

export async function deleteLayoutPrice(
  layoutIdValue: string,
  priceIdValue: string,
) {
  const layoutId = parseId(layoutIdValue, "layout ID");
  const priceId = parseId(priceIdValue, "price ID");
  const result = await prisma.layoutPrice.deleteMany({
    where: { id: priceId, layoutId },
  });
  if (result.count === 0) throw new AppError(404, "Layout price not found.");
  return { id: priceId.toString(), layoutId: layoutId.toString() };
}
