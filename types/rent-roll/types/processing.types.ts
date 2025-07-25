// === File Processing Types ===

export type FileType = "excel" | "csv";

export interface FileProcessorResult {
  type: FileType;
  sheets: Array<{
    name: string;
    data: unknown[][];
    index: number;
  }>;
}

// === Processing Options ===

export interface ProcessingOptions {
  maxSheetsToProcess?: number;
  skipSummarySheets?: boolean;
  requireMinimumUnits?: number;
  dateFormat?: string;
}
