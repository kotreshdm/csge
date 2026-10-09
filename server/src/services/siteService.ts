import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { optionalDate, requiredString } from "../utils/validation.js";

type Input = Record<string, unknown>;
type SiteStatus =
  | "AVAILABLE"
  | "TEMP_ALLOTTED"
  | "ALLOTTED"
  | "REGISTERED"
  | "SETTLED";
const siteStatuses: SiteStatus[] = [
  "AVAILABLE",
  "TEMP_ALLOTTED",
  "ALLOTTED",
  "REGISTERED",
  "SETTLED",
];

const siteRelations = {
  layout: { select: { id: true, layoutCode: true, name: true } },
  allottedMember: {
    select: { memberId: true, memberCode: true, name: true },
  },
} satisfies Prisma.SiteInclude;

function parseId(value: unknown, fieldName: string): bigint {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text) || BigInt(text) <= 0n) {
    throw new AppError(400, `Invalid ${fieldName}.`);
  }
  return BigInt(text);
}

function optionalMemberId(value: unknown): bigint | null {
  if (value === undefined || value === null || value === "") return null;
  return parseId(value, "member ID");
}

function parseDecimal(
  value: unknown,
  fieldName: string,
  defaultValue?: string,
): Prisma.Decimal {
  const raw =
    value === undefined || value === null || value === ""
      ? defaultValue
      : value;
  if (typeof raw !== "string" && typeof raw !== "number") {
    throw new AppError(400, `${fieldName} is required.`);
  }
  let parsed: Prisma.Decimal;
  try {
    parsed = new Prisma.Decimal(raw);
  } catch {
    throw new AppError(400, `${fieldName} must be a valid decimal number.`);
  }
  if (!parsed.isFinite() || parsed.lessThan(0)) {
    throw new AppError(
      400,
      `${fieldName} must be a non-negative decimal number.`,
    );
  }
  return parsed;
}

function parseStatus(
  value: unknown,
  fallback: SiteStatus = "AVAILABLE",
): SiteStatus {
  if (value === undefined || value === null || value === "") return fallback;
  const status = String(value).trim().toUpperCase();
  if (status === "ALLOCATED") return "ALLOTTED";
  if (!siteStatuses.includes(status as SiteStatus)) {
    throw new AppError(
      400,
      `Status must be one of: ${siteStatuses.join(", ")}.`,
    );
  }
  return status as SiteStatus;
}

function siteData(input: Input) {
  const siteNo = requiredString(input.siteNo, "Site number");
  const layoutId = parseId(input.layoutId, "layout ID");
  const eastWest = parseDecimal(input.eastWest, "East-west dimension");
  const northSouth = parseDecimal(input.northSouth, "North-south dimension");
  const totalSqFeet = parseDecimal(input.totalSqFeet, "Total square feet");
  const totalPrice = parseDecimal(input.totalPrice, "Total price", "0");
  const registeredAmount = parseDecimal(
    input.registeredAmount,
    "Registered amount",
    "0",
  );
  const allottedMemberId = optionalMemberId(input.allottedMemberId);
  const allotmentDate = optionalDate(input.allotmentDate, "Allotment date");
  const status = parseStatus(
    input.status,
    allottedMemberId ? "ALLOTTED" : "AVAILABLE",
  );
  if (status !== "AVAILABLE" && allottedMemberId === null) {
    throw new AppError(
      400,
      "A site must have an allotted member for this status.",
    );
  }
  if (status === "AVAILABLE" && allottedMemberId !== null) {
    throw new AppError(
      400,
      "An available site cannot have an allotted member.",
    );
  }
  return {
    siteNo,
    layoutId,
    eastWest,
    northSouth,
    totalSqFeet,
    totalPrice,
    registeredAmount,
    allottedMemberId,
    allotmentDate,
    status,
  };
}

function serializeSite<
  T extends {
    id: bigint;
    layoutId: bigint;
    eastWest: Prisma.Decimal;
    northSouth: Prisma.Decimal;
    totalSqFeet: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    registeredAmount: Prisma.Decimal;
    allottedMemberId: bigint | null;
    allotmentDate: Date | null;
    status: string;
    layout: { id: bigint; layoutCode: string; name: string };
    allottedMember: {
      memberId: bigint;
      memberCode: string;
      name: string;
    } | null;
  },
>(site: T) {
  return {
    ...site,
    id: site.id.toString(),
    layoutId: site.layoutId.toString(),
    eastWest: site.eastWest.toString(),
    northSouth: site.northSouth.toString(),
    totalSqFeet: site.totalSqFeet.toString(),
    totalPrice: site.totalPrice.toString(),
    registeredAmount: site.registeredAmount.toString(),
    allottedMemberId: site.allottedMemberId?.toString() ?? null,
    allotmentDate: site.allotmentDate?.toISOString().slice(0, 10) ?? null,
    status: parseStatus(site.status),
    layout: { ...site.layout, id: site.layout.id.toString() },
    allottedMember: site.allottedMember
      ? {
          ...site.allottedMember,
          memberId: site.allottedMember.memberId.toString(),
        }
      : null,
  };
}

function handleSiteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        409,
        "This site number already exists in the selected layout.",
      );
    }
    if (error.code === "P2003") {
      throw new AppError(400, "The selected layout or member does not exist.");
    }
    if (error.code === "P2025") throw new AppError(404, "Site not found.");
  }
  throw error;
}

export async function getSites() {
  const sites = await prisma.site.findMany({
    include: siteRelations,
    orderBy: [{ layout: { name: "asc" } }, { siteNo: "asc" }, { id: "asc" }],
  });
  return sites.map(serializeSite);
}

export async function createSite(input: Input) {
  try {
    return serializeSite(
      await prisma.site.create({
        data: siteData(input),
        include: siteRelations,
      }),
    );
  } catch (error) {
    handleSiteError(error);
  }
}
export async function updateSite(idValue: string, input: Input) {
  const id = parseId(idValue, "site ID");
  try {
    return serializeSite(
      await prisma.site.update({
        where: { id },
        data: siteData(input),
        include: siteRelations,
      }),
    );
  } catch (error) {
    handleSiteError(error);
  }
}

export async function assignSite(idValue: string, memberValue: unknown) {
  const id = parseId(idValue, "site ID");
  const allottedMemberId = optionalMemberId(memberValue);
  try {
    return serializeSite(
      await prisma.site.update({
        where: { id },
        data: {
          allottedMemberId,
          status: allottedMemberId ? "ALLOTTED" : "AVAILABLE",
          allotmentDate: allottedMemberId
            ? new Date(new Date().toISOString().slice(0, 10))
            : null,
        },
        include: siteRelations,
      }),
    );
  } catch (error) {
    handleSiteError(error);
  }
}

export async function changeSiteStatus(idValue: string, statusValue: unknown) {
  const id = parseId(idValue, "site ID");
  const status = parseStatus(statusValue);
  const existing = await prisma.site.findUnique({
    where: { id },
    select: { allottedMemberId: true },
  });
  if (!existing) throw new AppError(404, "Site not found.");
  if (status !== "AVAILABLE" && existing.allottedMemberId === null) {
    throw new AppError(
      400,
      "Assign a member before selecting this site status.",
    );
  }
  try {
    return serializeSite(
      await prisma.site.update({
        where: { id },
        data: {
          status,
          ...(status === "AVAILABLE"
            ? { allottedMemberId: null, allotmentDate: null }
            : {}),
        },
        include: siteRelations,
      }),
    );
  } catch (error) {
    handleSiteError(error);
  }
}
