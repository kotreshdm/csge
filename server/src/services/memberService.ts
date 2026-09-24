import * as XLSX from "xlsx";

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

export interface MemberUploadResult {
  filename: string;
  size: number;
  totalRows: number;
  createdRows: number;
  failedRows: number;
  rows: Array<{
    memberCode: string;
    name: string;
  }>;
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

  const createdRows: Array<{ memberCode: string; name: string }> = [];
  const failedRows: string[] = [];

  for (const [index, row] of rows.entries()) {
    const record = normalizeMemberRow(row);

    if (!record.memberCode || !record.name) {
      failedRows.push(`Row ${index + 2}: missing MemberCode or Name`);
      continue;
    }

    try {
      const memberType = normalizeMemberType(record.memberType);
      const status = normalizeMemberStatus(record.status);
      const gender = normalizeGender(record.gender);

      const created = await prisma.member.create({
        data: {
          memberCode: record.memberCode,
          recieptNo: record.recieptNo || null,
          joinDate: record.joinDate ?? null,
          name: record.name,
          nameKannada: record.nameKannada || null,
          careOfName: record.careOfName || null,
          careOfNameKannada: record.careOfNameKannada || null,
          age: record.age || null,
          mobile: record.mobile || null,
          memberType,
          status,
          gender: gender ?? null,
          addressLine1: record.addressLine1 || null,
          addressLine2: record.addressLine2 || null,
          city: record.city || null,
          district: record.district || null,
          addressLine1Kannada: record.addressLine1Kannada || null,
          addressLine2Kannada: record.addressLine2Kannada || null,
          cityKannada: record.cityKannada || null,
          districtKannada: record.districtKannada || null,
          postalCode: record.postalCode || null,
        },
      });

      createdRows.push({
        memberCode: created.memberCode,
        name: created.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failedRows.push(`Row ${index + 2}: ${message}`);
    }
  }

  return {
    filename: fileName,
    size: buffer.length,
    totalRows: rows.length,
    createdRows: createdRows.length,
    failedRows: failedRows.length,
    rows: createdRows,
    errors: failedRows,
  };
}
