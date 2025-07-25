import { z } from "zod";
import type { DocumentType } from "./documents";

export const ProgressStatus = z.enum(["pending", "processing", "completed", "failed"]);

export type ProgressStatus = z.infer<typeof ProgressStatus>;

export const ProgressStage = z.enum([
  "initializing",
  "analyzing_documents",
  "processing_rent_roll",
  "processing_t12",
  "processing_underwritten_file",
  "processing_concessions_report",
  "processing_floor_plans",
  "processing_ground_lease",
  "processing_lease_trade_out_report",
  "aggregating_summaries",
  "generating_description",
  "completed",
  "failed",
]);

export type ProgressStage = z.infer<typeof ProgressStage>;

export const DocumentProgressSchema = z.object({
  documentId: z.string(),
  documentType: z.string(),
  documentName: z.string(),
  status: ProgressStatus,
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  error: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
});

export type DocumentProgress = z.infer<typeof DocumentProgressSchema>;

export const OverallProgressSchema = z.object({
  sessionId: z.string(),
  stage: ProgressStage,
  status: ProgressStatus,
  message: z.string(),
  progress: z.number().min(0).max(100),
  documentsProgress: z.array(DocumentProgressSchema),
  startTime: z.date(),
  endTime: z.date().optional(),
  estimatedTimeRemaining: z.number().optional(),
  error: z.string().optional(),
});

export type OverallProgress = z.infer<typeof OverallProgressSchema>;

export const ProgressEventSchema = z.object({
  type: z.enum(["progress", "document_complete", "stage_change", "error", "complete"]),
  sessionId: z.string(),
  timestamp: z.date(),
  data: z.union([
    OverallProgressSchema,
    DocumentProgressSchema,
    z.object({ error: z.string() }),
    z.object({ finalResult: z.unknown() }),
  ]),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

export const STAGE_MESSAGES: Record<ProgressStage, string> = {
  initializing: "Initializing document processing...",
  analyzing_documents: "Analyzing uploaded documents...",
  processing_rent_roll: "Analyzing rent roll data...",
  processing_t12: "Processing T12 operating statement...",
  processing_underwritten_file: "Reviewing underwritten projections...",
  processing_concessions_report: "Analyzing concessions report...",
  processing_floor_plans: "Processing floor plans...",
  processing_ground_lease: "Reviewing ground lease terms...",
  processing_lease_trade_out_report: "Analyzing lease trade-out data...",
  aggregating_summaries: "Combining document insights...",
  generating_description: "Generating deal description...",
  completed: "Process completed successfully!",
  failed: "Processing failed",
};

export const DOCUMENT_TYPE_TO_STAGE: Record<DocumentType, ProgressStage> = {
  rent_roll: "processing_rent_roll",
  t12: "processing_t12",
  underwritten_file: "processing_underwritten_file",
  concessions_report: "processing_concessions_report",
  floor_plans: "processing_floor_plans",
  ground_lease: "processing_ground_lease",
  lease_trade_out_report: "processing_lease_trade_out_report",
};
