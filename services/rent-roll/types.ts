import { z } from "zod"

// === Core Data Types ===

export interface RentRollUnit {
  unit_number: string
  floor_plan?: string
  square_footage: number | null
  current_rent: number | null
  lease_start: Date | null
  lease_end: Date | null
  occupancy_status: string
  market_rent: number | null
  tenant_name: string
  [key: string]: unknown
}

export interface RentRollSummary {
  total_units: number
  occupied_units: number
  vacant_units: number
  total_rent: number
  average_rent: number
  average_sqft: number
  occupancy_rate: number
}

// === Column Mapping & Headers ===

export const ColumnMappingSchema = z.object({
  unit_number: z.string(),
  floor_plan: z.string().optional(),
  square_footage: z.string().optional(),
  current_rent: z.string(),
  lease_start: z.string().optional(),
  lease_end: z.string().optional(),
  occupancy_status: z.string(),
  market_rent: z.string().optional(),
  tenant_name: z.string(),
})

export type ColumnMapping = z.infer<typeof ColumnMappingSchema>

export interface HeaderDetectionResult {
  headerRow: number
  dataStartRow: number
  headers: Record<string, string>
  columnMapping: Partial<ColumnMapping>
  confidence: number
}

// === Sheet Information ===

export interface SheetInfo {
  name: string
  index: number
  type: "rent_roll" | "summary" | "unknown"
  propertyName?: string
}

export interface ProcessedSheet {
  sheetInfo: SheetInfo
  headerDetection: HeaderDetectionResult
  data: RentRollUnit[]
  summary: RentRollSummary
  errors: string[]
}

// === Processing Results ===

export interface RentRollProcessingResult {
  success: boolean
  sheets: ProcessedSheet[]
  errors: string[]
  processingTimeMs: number
  extractedTenants: ExtractedTenantData[]
}

// === Tenant Integration ===

export interface ExtractedTenantData {
  id: string
  tenantName: string
  unitNumber: string
  currentRent: number | null
  leaseStartDate: string
  leaseEndDate: string
  occupancyStatus: string
  squareFootage: number | null
  source: "rent_roll"
}

// === AI Analysis Schemas ===

export const HeaderAnalysisSchema = z.object({
  headerRow: z.number(),
  dataStartRow: z.number(),
  columnMapping: ColumnMappingSchema.partial(),
  confidence: z.number().min(0).max(1),
})

export type HeaderAnalysisResult = z.infer<typeof HeaderAnalysisSchema>

export const SheetClassificationSchema = z.object({
  type: z.enum(["rent_roll", "summary", "unknown"]),
  propertyName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export type SheetClassificationResult = z.infer<
  typeof SheetClassificationSchema
>

// === Raw Data Types ===

export interface RawSheetData {
  name: string
  data: unknown[][]
  index: number
}

export interface FileProcessorResult {
  type: "excel" | "csv"
  sheets: RawSheetData[]
}
