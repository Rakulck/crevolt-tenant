import { Effect } from "effect"
import type {
  DocumentAnalysisResult,
  DocumentFile,
  DocumentSummary,
} from "../index"

export interface DocumentAnalyzer {
  analyzeDocument(
    document: DocumentFile,
  ): Effect.Effect<DocumentAnalysisResult, Error>
  getSupportedDocumentType(): string
}

export abstract class BaseDocumentAnalyzer implements DocumentAnalyzer {
  abstract analyzeDocument(
    document: DocumentFile,
  ): Effect.Effect<DocumentAnalysisResult, Error>
  abstract getSupportedDocumentType(): string

  protected createAnalysisResult(
    document: DocumentFile,
    success: boolean,
    summary?: string,
    extractedData?: Record<string, unknown>,
    error?: string,
    processingTimeMs = 0,
  ): DocumentAnalysisResult {
    return {
      documentId: document.id,
      documentType: document.type,
      success,
      summary,
      extractedData,
      error,
      processingTimeMs,
      analysisTimestamp: new Date(),
    }
  }

  protected validateFile(file: File): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        throw new Error("File size too large. Maximum size is 50MB.")
      }

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
        "image/png",
        "image/jpeg",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`)
      }
    })
  }

  protected async convertFileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    return Buffer.from(buffer).toString("base64")
  }
}
