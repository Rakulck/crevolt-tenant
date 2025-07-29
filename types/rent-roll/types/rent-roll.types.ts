import { z } from "zod";

// === Core Data Types ===

export interface RentRollUnit {
  unit_number: string;
  floor_plan: string;
  square_footage: number | null;
  current_rent: number | null;
  lease_start: Date | null;
  lease_end: Date | null;
  occupancy_status: string;
  market_rent: number | null;
  tenant_name: string;
  [key: string]: unknown;
}

export interface RentRollSummary {
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  total_rent: number;
  average_rent: number;
  average_sqft: number;
  occupancy_rate: number;
}

// === Column Mapping & Headers ===

export const ColumnMappingSchema = z.object({
  unit_number: z.string(),
  floor_plan: z.string(),
  square_footage: z.string(),
  current_rent: z.string(),
  lease_start: z.string(),
  lease_end: z.string(),
  occupancy_status: z.string(),
  market_rent: z.string(),
  tenant_name: z.string(),
});

export type ColumnMapping = z.infer<typeof ColumnMappingSchema>;

export interface HeaderDetectionResult {
  headerRow: number;
  dataStartRow: number;
  headers: Record<string, string>;
  columnMapping: ColumnMapping;
  confidence: number;
}

// === Sheet Information ===

export interface SheetInfo {
  name: string;
  index: number;
  type: "rent_roll" | "summary" | "unknown";
  propertyName?: string;
}

export interface ProcessedSheet {
  sheetInfo: SheetInfo;
  headerDetection: HeaderDetectionResult;
  data: RentRollUnit[];
  summary: RentRollSummary;
  errors: string[];
}

// === AI Analysis Schemas ===

export const HeaderAnalysisSchema = z.object({
  headerRow: z.number(),
  dataStartRow: z.number(),
  columnMapping: ColumnMappingSchema,
  confidence: z.number().min(0).max(1),
});

export type HeaderAnalysisResult = z.infer<typeof HeaderAnalysisSchema>;

export const SheetClassificationSchema = z.object({
  type: z.enum(["rent_roll", "summary", "unknown"]),
  propertyName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type SheetClassificationResult = z.infer<typeof SheetClassificationSchema>;
