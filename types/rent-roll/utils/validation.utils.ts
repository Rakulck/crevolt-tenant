import type { RentRollUnit } from "../types";

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const str = String(value).trim();

  // Handle common non-numeric indicators
  if (/^(down|vacant|n\/a|na|tbd|pending|-)$/i.test(str)) {
    return null;
  }

  const cleaned = str.replace(/[$,\s%]/g, "");
  const num = Number.parseFloat(cleaned);

  return Number.isFinite(num) && num >= 0 ? num : null;
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    // Filter out obviously invalid dates
    const year = value.getFullYear();
    if (year < 1990 || year > 2035) return null;
    return value;
  }

  const str = String(value).trim();

  // Handle common non-date indicators
  if (/^(down|vacant|n\/a|na|tbd|pending|-)$/i.test(str)) {
    return null;
  }

  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;

  // Filter out obviously invalid dates
  const year = date.getFullYear();
  if (year < 1990 || year > 2035) return null;

  return date;
}

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function validateUnit(rawData: Record<string, unknown>): RentRollUnit | null {
  const unit: RentRollUnit = {
    unit_number: normalizeString(rawData.unit_number),
    floor_plan: normalizeString(rawData.floor_plan),
    square_footage: parseNumber(rawData.square_footage),
    current_rent: parseNumber(rawData.current_rent),
    lease_start: parseDate(rawData.lease_start),
    lease_end: parseDate(rawData.lease_end),
    occupancy_status: normalizeString(rawData.occupancy_status),
    market_rent: parseNumber(rawData.market_rent),
    tenant_name: normalizeString(rawData.tenant_name),
  };

  // Must have a valid unit number
  if (!unit.unit_number || unit.unit_number.length === 0) {
    return null;
  }

  // Skip rows that are clearly not unit data
  if (isInvalidUnitNumber(unit.unit_number)) {
    return null;
  }

  return unit;
}

function isInvalidUnitNumber(unitNumber: string): boolean {
  const lower = unitNumber.toLowerCase();
  const invalidPatterns = [
    "total",
    "summary",
    "subtotal",
    "grand total",
    "average",
    "occupied units",
    "vacant units",
    "revenue",
    "non rev",
    "current/notice",
    "future residents",
    "applicants",
    "groups",
    "unknown",
    "square",
    "totals",
  ];

  return invalidPatterns.some((pattern) => lower.includes(pattern));
}

export function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "");
}

export function hasMinimumData(row: unknown[], requiredFields = 2): boolean {
  const nonEmptyFields = row.filter(
    (cell) => cell !== null && cell !== undefined && String(cell).trim() !== "",
  ).length;

  return nonEmptyFields >= requiredFields;
}

export function inferOccupancyStatus(
  status: string,
  tenantName: string,
  currentRent: number | null,
): string {
  const normalizedStatus = status.toLowerCase().trim();

  // Handle specific indicators
  if (
    normalizedStatus.includes("vacant") ||
    normalizedStatus.includes("empty") ||
    normalizedStatus === "down" ||
    tenantName.toLowerCase().includes("vacant")
  ) {
    return "Vacant";
  }

  if (normalizedStatus.includes("occupied") || normalizedStatus.includes("rented")) {
    return "Occupied";
  }

  if (normalizedStatus.includes("notice") || normalizedStatus.includes("moving")) {
    return "Notice Given";
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("approved")) {
    return "Pending";
  }

  // Infer from tenant name and rent
  if (
    tenantName &&
    tenantName.trim() !== "" &&
    !tenantName.toLowerCase().includes("vacant") &&
    currentRent &&
    currentRent > 0
  ) {
    return "Occupied";
  }

  if (
    !tenantName ||
    tenantName.trim() === "" ||
    tenantName.toLowerCase().includes("vacant") ||
    !currentRent ||
    currentRent === 0
  ) {
    return "Vacant";
  }

  return status || "Unknown";
}

export function cleanNumericString(value: string): string {
  return value.replace(/[^\d.-]/g, "");
}

export function isLikelyHeaderRow(row: unknown[]): boolean {
  const nonEmptyCount = row.filter(
    (cell) => cell !== null && cell !== undefined && String(cell).trim() !== "",
  ).length;

  if (nonEmptyCount < 3) return false;

  const textCells = row.filter((cell) => {
    const str = String(cell || "").toLowerCase();
    return (
      str.includes("unit") ||
      str.includes("rent") ||
      str.includes("tenant") ||
      str.includes("lease") ||
      str.includes("sqft") ||
      str.includes("status") ||
      str.includes("plan") ||
      str.includes("name")
    );
  });

  return textCells.length >= 2;
}
