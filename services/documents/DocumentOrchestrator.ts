import type {
  DocumentAnalysisResult,
  DocumentFile,
  DocumentProcessingRequest,
  DocumentProcessingResponse,
} from "@/lib/types/documents"
import {
  DOCUMENT_TYPE_TO_STAGE,
  type DocumentProgress,
} from "@/lib/types/progress"
import { ratelimit } from "@v1/kv/ratelimit"
import { Console, Effect } from "effect"
import {
  ProgressPublisher,
  type ProgressSession,
} from "../progress/ProgressPublisher"
import { DocumentAnalyzerFactory } from "./DocumentAnalyzerFactory"
import { SummaryAggregator } from "./SummaryAggregator"

export const DocumentOrchestrator = {
  async processDocuments(
    files: File[],
    onProgress?: (processed: number, total: number) => void,
  ): Promise<DocumentAnalysisResult[]> {
    const results: DocumentAnalysisResult[] = []
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        // ... existing code ...
      } catch (error) {
        // ... existing code ...
      }

      if (onProgress) {
        onProgress(i + 1, total)
      }
    }

    return results
  },

  // ... other methods ...
}
