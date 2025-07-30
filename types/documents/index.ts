import { z } from "zod"

export const DocumentType = z.enum([
  "rent_roll",
  "t12",
  "underwritten_file",
  "concessions_report",
  "floor_plans",
  "ground_lease",
  "lease_trade_out_report",
])

export type DocumentType = z.infer<typeof DocumentType>

export const DocumentFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: DocumentType,
  file: z.instanceof(File),
  size: z.number(),
  uploadedAt: z.date().default(() => new Date()),
})

export type DocumentFile = z.infer<typeof DocumentFileSchema>

export const DocumentAnalysisResultSchema = z.object({
  documentId: z.string(),
  documentType: DocumentType,
  success: z.boolean(),
  summary: z.string().optional(),
  extractedData: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  processingTimeMs: z.number(),
  analysisTimestamp: z.date(),
})

export type DocumentAnalysisResult = z.infer<
  typeof DocumentAnalysisResultSchema
>

export const RentRollSummarySchema = z.object({
  totalUnits: z.number().optional(),
  occupancyRate: z.number().optional(),
  totalRent: z.number().optional(),
  averageRent: z.number().optional(),
  keyFindings: z.array(z.string()).default([]),
})

export const T12SummarySchema = z.object({
  netOperatingIncome: z.number().optional(),
  grossRent: z.number().optional(),
  expenses: z.number().optional(),
  capRate: z.number().optional(),
  keyMetrics: z.array(z.string()).default([]),
})

export const UnderwrittenFileSummarySchema = z.object({
  projectedIRR: z.number().optional(),
  projectedCashOnCash: z.number().optional(),
  equityMultiple: z.number().optional(),
  holdPeriod: z.number().optional(),
  keyAssumptions: z.array(z.string()).default([]),
})

export const ConcessionsReportSummarySchema = z.object({
  totalConcessions: z.number().optional(),
  averageConcessionPerUnit: z.number().optional(),
  mostCommonConcessions: z.array(z.string()).default([]),
  impactOnRent: z.number().optional(),
})

export const FloorPlansSummarySchema = z.object({
  unitTypes: z.array(z.string()).default([]),
  averageSquareFootage: z.number().optional(),
  bedroomDistribution: z.record(z.number()).optional(),
  amenityHighlights: z.array(z.string()).default([]),
})

export const GroundLeaseSummarySchema = z.object({
  leaseTermYears: z.number().optional(),
  annualRent: z.number().optional(),
  escalations: z.string().optional(),
  keyTerms: z.array(z.string()).default([]),
})

export const LeaseTradeOutSummarySchema = z.object({
  unitsTraded: z.number().optional(),
  averageRentIncrease: z.number().optional(),
  retentionRate: z.number().optional(),
  marketTrends: z.array(z.string()).default([]),
})

export const DocumentSummarySchema = z.discriminatedUnion("documentType", [
  z.object({
    documentType: z.literal("rent_roll"),
    data: RentRollSummarySchema,
  }),
  z.object({ documentType: z.literal("t12"), data: T12SummarySchema }),
  z.object({
    documentType: z.literal("underwritten_file"),
    data: UnderwrittenFileSummarySchema,
  }),
  z.object({
    documentType: z.literal("concessions_report"),
    data: ConcessionsReportSummarySchema,
  }),
  z.object({
    documentType: z.literal("floor_plans"),
    data: FloorPlansSummarySchema,
  }),
  z.object({
    documentType: z.literal("ground_lease"),
    data: GroundLeaseSummarySchema,
  }),
  z.object({
    documentType: z.literal("lease_trade_out_report"),
    data: LeaseTradeOutSummarySchema,
  }),
])

export type DocumentSummary = z.infer<typeof DocumentSummarySchema>

export const DocumentProcessingRequestSchema = z.object({
  dealId: z.string(),
  sessionId: z.string(),
  documents: z.array(DocumentFileSchema),
  dealInfo: z.object({
    dealName: z.string(),
    address: z.string().optional(),
    targetRaiseAmount: z.number().optional(),
    minimumInvestment: z.number().optional(),
    maximumInvestment: z.number().optional(),
    fundingDeadline: z.string().optional(),
  }),
})

export type DocumentProcessingRequest = z.infer<
  typeof DocumentProcessingRequestSchema
>

export const DocumentProcessingResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  processedDocuments: z.array(DocumentAnalysisResultSchema),
  aggregatedSummary: z.string().optional(),
  finalDescription: z.string().optional(),
  error: z.string().optional(),
  totalProcessingTimeMs: z.number(),
})

export type DocumentProcessingResponse = z.infer<
  typeof DocumentProcessingResponseSchema
>
