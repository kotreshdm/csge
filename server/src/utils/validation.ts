import { AppError } from "./AppError.js";
import { parseDateValue } from "./memberImportHelpers.js";

export function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

export function optionalString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, `${fieldName} must be a string.`);
  }

  return value.trim() || null;
}

export function requiredDate(value: unknown, fieldName: string): Date {
  const date = parseDateValue(value);

  if (!date) {
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim());
    throw new AppError(
      400,
      isMissing ? `${fieldName} is required.` : `${fieldName} must be a valid date.`,
    );
  }

  return date;
}

export function optionalDate(value: unknown, fieldName: string): Date | null {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const date = parseDateValue(value);

  if (!date) {
    throw new AppError(400, `${fieldName} must be a valid date.`);
  }

  return date;
}
