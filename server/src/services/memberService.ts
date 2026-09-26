import * as XLSX from "xlsx";
import {
  Prisma,
  type Gender,
  type MemberStatus,
  type MemberType,
} from "@prisma/client";

import prisma from "../db/prisma.js";
import {
  GENDER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_TYPE_MAP,
  type GenderValue,
  type MemberStatusValue,
  type MemberTypeValue,
} from "../constants/memberMaps.js";
import { AppError } from "../utils/AppError.js";
import { getValue, parseDateValue } from "../utils/memberImportHelpers.js";

export interface UploadedMemberRow {
  row: number;
  memberCode: string;
  name: string;
}

export interface FailedMemberRow {
  row: number;
  memberCode: string;
  name: string;
  error: string;
}

export interface CreateMemberInput {
  memberCode?: string;
  recieptNo?: string;
  joinDate?: string | Date | null;
  name?: string;
  nameKannada?: string;
  careOfName?: string;
  careOfNameKannada?: string;
  mobile?: string;
  memberType?: string;
  status?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  addressLine1Kannada?: string;
  addressLine2Kannada?: string;
  cityKannada?: string;
  districtKannada?: string;
  postalCode?: string;
  fatherName?: string;
  fatherNameKannada?: string;
  spouseName?: string;
  spouseNameKannada?: string;
  dob?: string | Date | null;
  alternateMobile?: string;
  email?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  otherId?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeMobile?: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeDateOfBirth?: string | Date | null;
  occupation?: string;
  permanentAddress?: string;
  officeAddress?: string;
  remarks?: string;
}

export interface MemberUploadResult {
  filename: string;
  size: number;
  totalRows: number;
  createdRows: number;
  failedRows: number;
  created: Array<{
    row: number;
    memberId: string;
    memberCode: string;
    name: string;
  }>;
  failed: FailedMemberRow[];
  rows: UploadedMemberRow[];
  errors: string[];
}

function normalizeMemberType(value?: string): MemberTypeValue {
  const key = value?.trim().toLowerCase();

  return key && key in MEMBER_TYPE_MAP
    ? MEMBER_TYPE_MAP[key as keyof typeof MEMBER_TYPE_MAP]
    : "MEMBER";
}

function normalizeMemberStatus(value?: string): MemberStatusValue {
  const key = value?.trim().toLowerCase();

  return key && key in MEMBER_STATUS_MAP
    ? MEMBER_STATUS_MAP[key as keyof typeof MEMBER_STATUS_MAP]
    : "ACTIVE";
}

function normalizeGender(value?: string): GenderValue | null {
  const key = value?.trim().toLowerCase();

  return key && key in GENDER_MAP
    ? GENDER_MAP[key as keyof typeof GENDER_MAP]
    : null;
}

function calculateDobFromAge(
  ageValue: string | undefined,
  joinDate: Date | null,
): Date | null {
  const fallbackDob = new Date(Date.UTC(1990, 0, 1));

  if (!ageValue || !joinDate || Number.isNaN(joinDate.getTime())) {
    return fallbackDob;
  }

  const age = Number(ageValue);

  if (!Number.isFinite(age) || age < 0) {
    return fallbackDob;
  }

  if (age === 0) {
    return fallbackDob;
  }

  const dob = new Date(joinDate.getTime());
  dob.setUTCFullYear(joinDate.getUTCFullYear() - age);

  return dob;
}

function normalizeMemberRow(record: Record<string, unknown>) {
  return {
    memberCode: getValue(record, "memberCode"),
    recieptNo: getValue(record, "recieptNo"),
    joinDate: parseDateValue(getValue(record, "joinDate")),
    name: getValue(record, "name"),
    nameKannada: getValue(record, "nameKannada"),
    careOfName: getValue(record, "careOfName"),
    careOfNameKannada: getValue(record, "careOfNameKannada"),
    age: getValue(record, "age"),
    mobile: getValue(record, "mobile"),
    memberType: getValue(record, "memberType"),
    status: getValue(record, "status"),
    gender: getValue(record, "gender"),
    addressLine1: getValue(record, "addressLine1"),
    addressLine2: getValue(record, "addressLine2"),
    city: getValue(record, "city"),
    district: getValue(record, "district"),
    addressLine1Kannada: getValue(record, "addressLine1Kannada"),
    addressLine2Kannada: getValue(record, "addressLine2Kannada"),
    cityKannada: getValue(record, "cityKannada"),
    districtKannada: getValue(record, "districtKannada"),
    postalCode: getValue(record, "postalCode"),
    permanentAddress: getValue(record, "permanentAddress"),
    officeAddress: getValue(record, "officeAddress"),
  };
}

function expectRequiredString(value: unknown, fieldName: string): string {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    throw new AppError(400, `${fieldName} is required.`);
  }

  return trimmed;
}

function expectMaxLength(value: unknown, fieldName: string, maxLength: number) {
  const text = String(value ?? "").trim();

  if (text && text.length > maxLength) {
    throw new AppError(
      400,
      `${fieldName} should not exceed ${maxLength} characters.`,
    );
  }
}

const MEMBER_FIELD_MAX_LENGTHS: Record<string, number> = {
  memberCode: 8,
  recieptNo: 8,
  name: 50,
  nameKannada: 50,
  careOfName: 50,
  careOfNameKannada: 50,
  mobile: 10,
  addressLine1: 255,
  addressLine2: 255,
  city: 50,
  district: 50,
  addressLine1Kannada: 255,
  addressLine2Kannada: 255,
  cityKannada: 50,
  districtKannada: 50,
  postalCode: 6,
  fatherName: 50,
  fatherNameKannada: 50,
  spouseName: 50,
  spouseNameKannada: 50,
  alternateMobile: 10,
  email: 100,
  aadhaarNumber: 16,
  panNumber: 11,
  otherId: 20,
  nomineeName: 50,
  nomineeRelation: 15,
  nomineeMobile: 10,
  nomineeEmail: 50,
  nomineeAddress: 200,
  occupation: 150,
  permanentAddress: 200,
  officeAddress: 200,
  remarks: 200,
};

function validateMaxLengths(input: Record<string, unknown>) {
  for (const [fieldName, maxLength] of Object.entries(
    MEMBER_FIELD_MAX_LENGTHS,
  )) {
    const value = input[fieldName];

    if (value === undefined || value === null || value === "") {
      continue;
    }

    expectMaxLength(value, fieldName, maxLength);
  }
}

export async function getMembers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  memberType?: string;
  status?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = Number(params?.page ?? 1);
  const limit = Number(params?.limit ?? 20);
  const searchValue =
    typeof params?.search === "string" ? params.search.trim() : "";
  const baseFilters = params?.filters ?? {};
  const memberType =
    typeof params?.memberType === "string" ? params.memberType : "";
  const status = typeof params?.status === "string" ? params.status : "";
  const gender = typeof params?.gender === "string" ? params.gender : "";
  const sortBy = [
    "memberCode",
    "recieptNo",
    "joinDate",
    "name",
    "status",
    "mobile",
  ].includes(params?.sortBy ?? "")
    ? (params?.sortBy as string)
    : "memberCode";
  const sortOrder = params?.sortOrder === "desc" ? "desc" : "asc";

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const validPageSizes = [20, 50, 100];
  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? validPageSizes.includes(Math.floor(limit))
        ? Math.floor(limit)
        : 20
      : 20;
  const where: Prisma.MemberWhereInput = {
    ...(memberType && {
      memberType: memberType as MemberType,
    }),
    ...(status && {
      status: status as MemberStatus,
    }),
    ...(gender && {
      gender: gender as Gender,
    }),
    ...(searchValue && {
      OR: [
        { memberCode: { contains: searchValue, mode: "insensitive" } },
        { recieptNo: { contains: searchValue, mode: "insensitive" } },
        { name: { contains: searchValue, mode: "insensitive" } },
        { nameKannada: { contains: searchValue, mode: "insensitive" } },
        { mobile: { contains: searchValue, mode: "insensitive" } },
        { careOfName: { contains: searchValue, mode: "insensitive" } },
        { careOfNameKannada: { contains: searchValue, mode: "insensitive" } },
        { addressLine1: { contains: searchValue, mode: "insensitive" } },
        { addressLine2: { contains: searchValue, mode: "insensitive" } },
        { addressLine1Kannada: { contains: searchValue, mode: "insensitive" } },
        { addressLine2Kannada: { contains: searchValue, mode: "insensitive" } },
        { city: { contains: searchValue, mode: "insensitive" } },
        { cityKannada: { contains: searchValue, mode: "insensitive" } },
        { district: { contains: searchValue, mode: "insensitive" } },
        { districtKannada: { contains: searchValue, mode: "insensitive" } },
        { postalCode: { contains: searchValue, mode: "insensitive" } },
      ],
    }),
  };

  const skip = (safePage - 1) * safeLimit;

  const orderBy: Prisma.MemberOrderByWithRelationInput[] = [
    { [sortBy]: sortOrder },
    { memberId: "asc" },
  ] as Prisma.MemberOrderByWithRelationInput[];

  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: safeLimit,
      select: {
        memberId: true,
        memberCode: true,
        recieptNo: true,
        name: true,
        nameKannada: true,
        careOfName: true,
        careOfNameKannada: true,
        mobile: true,
        memberType: true,
        status: true,
        gender: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        district: true,
        addressLine1Kannada: true,
        addressLine2Kannada: true,
        cityKannada: true,
        districtKannada: true,
        postalCode: true,
        joinDate: true,
      },
      orderBy,
    }),
    prisma.member.count({
      where,
    }),
  ]);

  return {
    items: items.map((member) => ({
      ...member,
      memberId: member.memberId.toString(),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

export async function createMember(input: Record<string, unknown>) {
  const memberCode = expectRequiredString(input.memberCode, "Member code");
  const recieptNo = expectRequiredString(input.recieptNo, "Receipt number");
  const joinDate = parseDateValue(input.joinDate);
  const name = expectRequiredString(input.name, "Member name");
  const nameKannada = expectRequiredString(
    input.nameKannada,
    "Name in Kannada",
  );
  const mobile = expectRequiredString(input.mobile, "Mobile number");
  const addressLine1 = expectRequiredString(
    input.addressLine1,
    "Address line 1",
  );
  const addressLine2 = expectRequiredString(
    input.addressLine2,
    "Address line 2",
  );
  const city = expectRequiredString(input.city, "City");
  const district = expectRequiredString(input.district, "District");

  if (!joinDate) {
    throw new AppError(400, "Join date is required.");
  }

  validateMaxLengths(input);

  const postalCode = String(input.postalCode ?? "").trim();
  const alternateMobile = String(input.alternateMobile ?? "").trim();
  const nomineeMobile = String(input.nomineeMobile ?? "").trim();

  expectMaxLength(memberCode, "Member code", 8);
  expectMaxLength(recieptNo, "Receipt number", 8);
  expectMaxLength(mobile, "Mobile number", 10);
  expectMaxLength(alternateMobile, "Alternate mobile number", 10);
  expectMaxLength(nomineeMobile, "Nominee mobile number", 10);
  expectMaxLength(postalCode, "Postal code", 6);
  expectMaxLength(
    String(input.aadhaarNumber ?? "").trim(),
    "Aadhaar number",
    16,
  );
  expectMaxLength(String(input.panNumber ?? "").trim(), "PAN number", 11);

  const existingMember = await prisma.member.findUnique({
    where: { memberCode },
  });

  if (existingMember) {
    throw new AppError(409, `Member code '${memberCode}' already exists.`);
  }

  const memberType = normalizeMemberType(String(input.memberType ?? "MEMBER"));
  const status = normalizeMemberStatus(String(input.status ?? "ACTIVE"));
  const gender = normalizeGender(String(input.gender ?? ""));
  const dob = parseDateValue(input.dob);
  const nomineeDateOfBirth = parseDateValue(input.nomineeDateOfBirth);

  const createdMember = await prisma.member.create({
    data: {
      memberCode,
      recieptNo,
      joinDate,
      name,
      nameKannada,
      careOfName: String(input.careOfName ?? "") || null,
      careOfNameKannada: String(input.careOfNameKannada ?? "") || null,
      mobile,
      memberType,
      status,
      gender: gender ?? null,
      addressLine1,
      addressLine2,
      city,
      district,
      addressLine1Kannada: String(input.addressLine1Kannada ?? "") || null,
      addressLine2Kannada: String(input.addressLine2Kannada ?? "") || null,
      cityKannada: String(input.cityKannada ?? "") || null,
      districtKannada: String(input.districtKannada ?? "") || null,
      postalCode: postalCode || null,
      fatherName: String(input.fatherName ?? "") || null,
      fatherNameKannada: String(input.fatherNameKannada ?? "") || null,
      spouseName: String(input.spouseName ?? "") || null,
      spouseNameKannada: String(input.spouseNameKannada ?? "") || null,
      dob: dob ?? null,
      alternateMobile: alternateMobile || null,
      email: String(input.email ?? "") || null,
      aadhaarNumber: String(input.aadhaarNumber ?? "") || null,
      panNumber: String(input.panNumber ?? "") || null,
      otherId: String(input.otherId ?? "") || null,
      nomineeName: String(input.nomineeName ?? "") || null,
      nomineeRelation: String(input.nomineeRelation ?? "") || null,
      nomineeMobile: nomineeMobile || null,
      nomineeEmail: String(input.nomineeEmail ?? "") || null,
      nomineeAddress: String(input.nomineeAddress ?? "") || null,
      nomineeDateOfBirth: nomineeDateOfBirth ?? null,
      occupation: String(input.occupation ?? "") || null,
      permanentAddress: String(input.permanentAddress ?? "") || null,
      officeAddress: String(input.officeAddress ?? "") || null,
      remarks: String(input.remarks ?? "") || null,
    },
  });

  return {
    ...createdMember,
    memberId: createdMember.memberId.toString(),
  };
}

export async function uploadMembersFromFile(
  buffer: Buffer,
  fileName: string,
): Promise<MemberUploadResult> {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new AppError(400, "The uploaded file has no worksheet.");
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    throw new AppError(
      400,
      "The uploaded file is empty or does not contain any member records.",
    );
  }

  const created: Array<{
    row: number;
    memberId: string;
    memberCode: string;
    name: string;
  }> = [];
  const failed: FailedMemberRow[] = [];

  for (const [index, row] of rows.entries()) {
    const record = normalizeMemberRow(row);
    const currentRow = index + 2;

    const normalizedMemberCode = String(record.memberCode ?? "").trim();
    const normalizedName = String(record.name ?? "").trim();
    const normalizedNameKannada = String(record.nameKannada ?? "").trim();
    const normalizedMobile = String(record.mobile ?? "").trim();
    const normalizedAddressLine1 = String(record.addressLine1 ?? "").trim();
    const normalizedAddressLine2 = String(record.addressLine2 ?? "").trim();
    const normalizedCity = String(record.city ?? "").trim();
    const normalizedDistrict = String(record.district ?? "").trim();
    const normalizedPostalCode = String(record.postalCode ?? "").trim();
    let rowLengthError: string | null = null;

    for (const [fieldName, maxLength] of Object.entries(
      MEMBER_FIELD_MAX_LENGTHS,
    )) {
      const value = (record as Record<string, unknown>)[fieldName];

      if (value === undefined || value === null || value === "") {
        continue;
      }

      if (String(value).trim().length > maxLength) {
        rowLengthError = `${fieldName} should not exceed ${maxLength} characters.`;
        break;
      }
    }

    if (rowLengthError) {
      failed.push({
        row: currentRow,
        memberCode: normalizedMemberCode,
        name: normalizedName,
        error: rowLengthError,
      });
      continue;
    }

    if (!normalizedMemberCode || !normalizedName || !normalizedNameKannada) {
      failed.push({
        row: currentRow,
        memberCode: normalizedMemberCode,
        name: normalizedName,
        error: "Required fields missing: memberCode, name, nameKannada",
      });
      continue;
    }

    if (normalizedMobile.length > 10) {
      failed.push({
        row: currentRow,
        memberCode: normalizedMemberCode,
        name: normalizedName,
        error: "Mobile number should not exceed 10 characters.",
      });
      continue;
    }

    if (normalizedPostalCode && normalizedPostalCode.length > 6) {
      failed.push({
        row: currentRow,
        memberCode: normalizedMemberCode,
        name: normalizedName,
        error: "Postal code should not exceed 6 characters.",
      });
      continue;
    }

    try {
      const memberType = normalizeMemberType(record.memberType);
      const status = normalizeMemberStatus(record.status);
      const gender = normalizeGender(record.gender);
      const dob = calculateDobFromAge(record.age, record.joinDate ?? null);

      const member = await prisma.member.create({
        data: {
          memberCode: normalizedMemberCode,
          recieptNo: String(record.recieptNo ?? "").trim() || null,
          joinDate: record.joinDate ?? null,
          name: normalizedName,
          nameKannada: normalizedNameKannada,
          careOfName: record.careOfName || null,
          careOfNameKannada: record.careOfNameKannada || null,
          dob: dob ?? null,
          mobile: normalizedMobile,
          memberType,
          status,
          gender: gender ?? null,
          addressLine1: normalizedAddressLine1,
          addressLine2: normalizedAddressLine2,
          city: normalizedCity,
          district: normalizedDistrict,
          addressLine1Kannada: record.addressLine1Kannada || null,
          addressLine2Kannada: record.addressLine2Kannada || null,
          cityKannada: record.cityKannada || null,
          districtKannada: record.districtKannada || null,
          postalCode: normalizedPostalCode || null,
          permanentAddress:
            String(record.permanentAddress ?? "").trim() || null,
          officeAddress: String(record.officeAddress ?? "").trim() || null,
        },
      });

      created.push({
        row: currentRow,
        memberId: member.memberId.toString(),
        memberCode: member.memberCode,
        name: member.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failed.push({
        row: currentRow,
        memberCode: record.memberCode,
        name: record.name,
        error: message,
      });
    }
  }

  return {
    filename: fileName,
    size: buffer.length,
    totalRows: rows.length,
    createdRows: created.length,
    failedRows: failed.length,
    created,
    failed,
    rows: created.map(({ row, memberCode, name }) => ({
      row,
      memberCode,
      name,
    })),
    errors: failed.map(
      ({ row, memberCode, name, error }) =>
        `Row ${row}: ${memberCode || name || "unknown"} - ${error}`,
    ),
  };
}
