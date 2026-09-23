import * as XLSX from "xlsx";

export function splitValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

export function getValue(row: Record<string, unknown>, key: string): string {
  if (row[key] !== undefined && row[key] !== null) {
    return splitValue(row[key]);
  }

  const fallbackKey = Object.keys(row).find(
    (candidate) => candidate.toLowerCase() === key.toLowerCase(),
  );

  return fallbackKey ? splitValue(row[fallbackKey]) : "";
}

export function parseDateValue(value: unknown): Date | null {
  const raw = splitValue(value);

  if (!raw) {
    return null;
  }

  if (!Number.isNaN(Number(raw)) && Number(raw) > 0) {
    const date = XLSX.SSF.parse_date_code(Number(raw));

    if (date) {
      const year = date.y ?? 1900;
      const month = date.m ?? 1;
      const day = date.d ?? 1;

      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export function extractPostalCode(address: string): string {
  const match = address.match(/\b\d{6}\b/);

  return match?.[0] ?? "";
}

export function parseAddress(address: string) {
  if (!address) {
    return {
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      postalCode: "",
    };
  }

  let remaining = address.trim();

  const postalCode = extractPostalCode(remaining);

  if (postalCode) {
    remaining = remaining.replace(postalCode, "");
  }

  remaining = remaining
    .replace(/\s*-\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();

  const parts = remaining
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let addressLine1 = "";
  let addressLine2 = "";
  let city = "";
  let district = "";

  if (parts.length >= 4) {
    addressLine1 = parts[0];
    addressLine2 = parts.slice(1, -2).join(", ");
    city = parts[parts.length - 2];
    district = parts[parts.length - 1];
  } else if (parts.length === 3) {
    addressLine1 = parts[0];
    addressLine2 = parts[1];
    city = parts[2];
  } else if (parts.length === 2) {
    addressLine1 = parts[0];
    city = parts[1];
  } else if (parts.length === 1) {
    addressLine1 = parts[0];
  }

  return {
    addressLine1,
    addressLine2,
    city,
    district,
    postalCode,
  };
}
