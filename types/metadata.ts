import { z } from "zod";
import type { ColumnMapping, HeaderDetectionResult } from "./underwriting/rent-roll";

// Lightweight metadata response types
export interface SheetMetadata {
  name: string;
  index: number;
  type: "rent_roll" | "summary" | "unknown";
  propertyName?: string;
  headerDetection: HeaderDetectionResult;
  rowCount: number;
  sampleData: unknown[][]; // First 5 rows for preview
}

export interface FileMetadata {
  name: string;
  size: number;
  type: "excel" | "csv" | "pdf";
  sheets: SheetMetadata[];
}

export interface ProcessingMetadata {
  success: boolean;
  processingTimeMs: number;
  fileInfo: FileMetadata;
  errors: string[];
  aiCacheKey?: string; // For caching AI results
}

// Raw file data structure for client-side processing
export interface RawSheetData {
  name: string;
  index: number;
  rows: unknown[][];
  headerRow: number;
  dataStartRow: number;
  columnMapping: ColumnMapping;
}

export interface RawFileData {
  type: "excel" | "csv" | "pdf";
  sheets: RawSheetData[];
}

// Combined response
export interface MetadataResponse {
  metadata: ProcessingMetadata;
  rawData: RawFileData;
}

// Client-side extraction result
export interface ClientExtractionResult {
  sheetIndex: number;
  data: Record<string, unknown>[];
  summary: {
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    total_rent: number;
    average_rent: number;
    average_sqft: number;
    occupancy_rate: number;
  };
  errors: string[];
}

// Cache structure for AI results
export interface AICacheEntry {
  key: string;
  headerDetection: HeaderDetectionResult;
  timestamp: number;
  expiresAt: number;
}

export const AICacheSchema = z.object({
  key: z.string(),
  headerDetection: z.object({
    headerRow: z.number(),
    dataStartRow: z.number(),
    headers: z.record(z.string()),
    columnMapping: z.object({
      unit_number: z.string(),
      floor_plan: z.string(),
      square_footage: z.string(),
      current_rent: z.string(),
      lease_start: z.string(),
      lease_end: z.string(),
      occupancy_status: z.string(),
      market_rent: z.string(),
      tenant_name: z.string(),
    }),
    confidence: z.number(),
  }),
  timestamp: z.number(),
  expiresAt: z.number(),
});

export type AICacheSchemaType = z.infer<typeof AICacheSchema>;
